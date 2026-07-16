[CmdletBinding()]
param(
    [ValidateSet("Quick", "Full")]
    [string]$Mode = "Full",

    [ValidateRange(5, 180)]
    [int]$TimeoutMinutes = 60,

    [switch]$Install,

    [switch]$SkipFrontend,

    [switch]$SkipFullStack,

    [switch]$SkipBrowsers,

    [switch]$KeepStack,

    [string]$ReportPath = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$startedAt = [DateTimeOffset]::UtcNow
$deadline = $startedAt.AddMinutes($TimeoutMinutes)
$results = [System.Collections.Generic.List[object]]::new()
$releaseError = $null

if ([string]::IsNullOrWhiteSpace($ReportPath)) {
    $ReportPath = Join-Path $repoRoot "testing\reports\shopverse-release-report.json"
}

function Get-RemainingSeconds {
    return [math]::Max(1, [math]::Floor(($deadline - [DateTimeOffset]::UtcNow).TotalSeconds))
}

function Assert-WithinDeadline {
    if ([DateTimeOffset]::UtcNow -ge $deadline) {
        throw "Release verification exceeded the ${TimeoutMinutes}-minute timeout."
    }
}

function Write-BoundedOutput {
    param(
        [string]$Label,
        [string]$Output,
        [int]$TailLines = 160
    )

    if ([string]::IsNullOrWhiteSpace($Output)) {
        return
    }

    Write-Host "--- $Label (last $TailLines lines) ---"
    $Output -split "`r?`n" |
        Select-Object -Last $TailLines |
        ForEach-Object { Write-Host $_ }
}

function Join-ProcessArguments {
    param([string[]]$Arguments = @())

    return (($Arguments | ForEach-Object {
        if ($null -eq $_) {
            return '""'
        }

        if ($_ -match '[\s"]') {
            return '"' + ($_ -replace '"', '\"') + '"'
        }

        return $_
    }) -join " ")
}

function Add-ReleaseResult {
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter(Mandatory)]
        [string]$Status,

        [double]$Seconds = 0,

        [string]$Detail = ""
    )

    $results.Add([pscustomobject]@{
        check = $Name
        status = $Status
        seconds = [math]::Round($Seconds, 1)
        detail = $Detail
    }) | Out-Null
}

function Invoke-ReleaseProcess {
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter(Mandatory)]
        [string]$FilePath,

        [string[]]$Arguments = @(),

        [Parameter(Mandatory)]
        [string]$WorkingDirectory,

        [switch]$ShowOutput
    )

    Assert-WithinDeadline

    $stopwatch = [Diagnostics.Stopwatch]::StartNew()
    Write-Host "[$Name] $FilePath $($Arguments -join ' ')"

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $FilePath
    $startInfo.Arguments = Join-ProcessArguments -Arguments $Arguments
    $startInfo.WorkingDirectory = $WorkingDirectory
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = [System.Diagnostics.Process]::Start($startInfo)
    $null = $process.Handle
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()

    $timeoutSeconds = Get-RemainingSeconds
    if (-not $process.WaitForExit($timeoutSeconds * 1000)) {
        & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
        $process.WaitForExit()
        $stdout = $stdoutTask.GetAwaiter().GetResult()
        $stderr = $stderrTask.GetAwaiter().GetResult()
        Write-BoundedOutput -Label "$Name stdout" -Output $stdout
        Write-BoundedOutput -Label "$Name stderr" -Output $stderr
        Add-ReleaseResult -Name $Name -Status "FAIL" -Seconds $stopwatch.Elapsed.TotalSeconds -Detail "Timed out after ${timeoutSeconds}s"
        throw "$Name exceeded its ${timeoutSeconds}-second timeout."
    }

    $stdout = $stdoutTask.GetAwaiter().GetResult()
    $stderr = $stderrTask.GetAwaiter().GetResult()

    if ($process.ExitCode -ne 0) {
        Write-BoundedOutput -Label "$Name stdout" -Output $stdout
        Write-BoundedOutput -Label "$Name stderr" -Output $stderr
        Add-ReleaseResult -Name $Name -Status "FAIL" -Seconds $stopwatch.Elapsed.TotalSeconds -Detail "Exit code $($process.ExitCode)"
        throw "$Name failed with exit code $($process.ExitCode)."
    }

    if ($ShowOutput) {
        Write-BoundedOutput -Label "$Name stdout" -Output $stdout
        Write-BoundedOutput -Label "$Name stderr" -Output $stderr
    }

    Add-ReleaseResult -Name $Name -Status "PASS" -Seconds $stopwatch.Elapsed.TotalSeconds
}

function Invoke-ReleaseScript {
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter(Mandatory)]
        [string]$ScriptPath,

        [string[]]$ScriptArguments = @()
    )

    Invoke-ReleaseProcess `
        -Name $Name `
        -FilePath "powershell" `
        -Arguments (@("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $ScriptPath) + $ScriptArguments) `
        -WorkingDirectory $repoRoot
}

function Get-GitSnapshot {
    try {
        $branch = (& git -C $repoRoot rev-parse --abbrev-ref HEAD 2>$null)
        $commit = (& git -C $repoRoot rev-parse --short HEAD 2>$null)
        $changes = @(& git -C $repoRoot status --short 2>$null)
        return [pscustomobject]@{
            branch = $branch
            commit = $commit
            dirtyFileCount = $changes.Count
            changes = $changes
        }
    } catch {
        return [pscustomobject]@{
            branch = ""
            commit = ""
            dirtyFileCount = -1
            changes = @("Git snapshot unavailable: $($_.Exception.Message)")
        }
    }
}

try {
    Write-Host "Shopverse release verification started. Mode=$Mode Timeout=${TimeoutMinutes}m"

    if (-not $SkipFrontend) {
        $siteMode = if ($Mode -eq "Quick") { "Quick" } else { "Full" }
        $siteArgs = @("-Target", "All", "-Mode", $siteMode, "-TimeoutMinutes", "$([math]::Max(5, [math]::Min(30, [math]::Floor((Get-RemainingSeconds) / 60))))")
        if ($Install) { $siteArgs += "-Install" }
        if ($SkipBrowsers) { $siteArgs += "-SkipBrowsers" }

        Invoke-ReleaseScript `
            -Name "frontend-sites-$($siteMode.ToLowerInvariant())" `
            -ScriptPath (Join-Path $PSScriptRoot "Test-ShopverseSites.ps1") `
            -ScriptArguments $siteArgs
    } else {
        Add-ReleaseResult -Name "frontend-sites" -Status "SKIP" -Detail "Skipped by -SkipFrontend"
    }

    if (-not $SkipFullStack) {
        $fullStackMode = if ($Mode -eq "Quick") { "Smoke" } else { "Full" }
        $fullStackArgs = @("-Mode", $fullStackMode, "-TimeoutMinutes", "$([math]::Max(10, [math]::Min(60, [math]::Floor((Get-RemainingSeconds) / 60))))")
        if ($Install) { $fullStackArgs += "-Install" }
        if ($SkipBrowsers) { $fullStackArgs += "-SkipBrowser" }
        if ($KeepStack) { $fullStackArgs += "-KeepStack" }

        Invoke-ReleaseScript `
            -Name "full-stack-$($fullStackMode.ToLowerInvariant())" `
            -ScriptPath (Join-Path $PSScriptRoot "Test-ShopverseFullStack.ps1") `
            -ScriptArguments $fullStackArgs
    } else {
        Add-ReleaseResult -Name "full-stack" -Status "SKIP" -Detail "Skipped by -SkipFullStack"
    }
} catch {
    $releaseError = $_
} finally {
    $finishedAt = [DateTimeOffset]::UtcNow
    $passed = $null -eq $releaseError -and -not (@($results) | Where-Object { $_.status -eq "FAIL" })
    $git = Get-GitSnapshot

    $report = [pscustomobject]@{
        name = "Shopverse release verification"
        mode = $Mode
        passed = $passed
        startedAt = $startedAt.ToString("o")
        finishedAt = $finishedAt.ToString("o")
        durationSeconds = [math]::Round(($finishedAt - $startedAt).TotalSeconds, 1)
        git = $git
        checks = @($results)
        error = if ($releaseError) { $releaseError.Exception.Message } else { "" }
    }

    $reportDirectory = Split-Path -Parent $ReportPath
    if (-not [string]::IsNullOrWhiteSpace($reportDirectory)) {
        New-Item -ItemType Directory -Force -Path $reportDirectory | Out-Null
    }
    $report | ConvertTo-Json -Depth 8 | Set-Content -Path $ReportPath -Encoding UTF8

    Write-Host ""
    Write-Host "Shopverse release verification: $Mode"
    @($results) | Format-Table check, status, seconds, detail -AutoSize
    Write-Host "Report: $ReportPath"
    Write-Host "Total duration: $([math]::Round(($finishedAt - $startedAt).TotalSeconds, 1))s"

    if ($releaseError) {
        throw $releaseError
    }
}
