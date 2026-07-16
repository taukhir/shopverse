[CmdletBinding()]
param(
    [ValidateSet("Web", "Docs", "All")]
    [string]$Target = "All",

    [ValidateSet("Quick", "Full")]
    [string]$Mode = "Full",

    [ValidateRange(1, 120)]
    [int]$TimeoutMinutes = 20,

    [switch]$Install,

    [switch]$SkipBrowsers
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$deadline = [DateTimeOffset]::UtcNow.AddMinutes($TimeoutMinutes)
$results = [System.Collections.Generic.List[object]]::new()

function Assert-WithinDeadline {
    if ([DateTimeOffset]::UtcNow -ge $deadline) {
        throw "Frontend site verification exceeded the ${TimeoutMinutes}-minute timeout."
    }
}

function Get-RemainingSeconds {
    return [math]::Max(1, [math]::Floor(($deadline - [DateTimeOffset]::UtcNow).TotalSeconds))
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

function Invoke-CheckedProcess {
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter(Mandatory)]
        [string]$WorkingDirectory,

        [Parameter(Mandatory)]
        [string]$Command,

        [int]$TimeoutSeconds = 0
    )

    Assert-WithinDeadline

    $effectiveTimeout = if ($TimeoutSeconds -gt 0) {
        [math]::Min($TimeoutSeconds, (Get-RemainingSeconds))
    } else {
        Get-RemainingSeconds
    }

    $stopwatch = [Diagnostics.Stopwatch]::StartNew()
    Write-Host "[$Name] $Command"

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = "cmd.exe"
    $startInfo.Arguments = "/d /s /c `"$Command`""
    $startInfo.WorkingDirectory = $WorkingDirectory
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = [System.Diagnostics.Process]::Start($startInfo)
    $null = $process.Handle
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()

    try {
        if (-not $process.WaitForExit($effectiveTimeout * 1000)) {
            & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
            $process.WaitForExit()
            $stdout = $stdoutTask.GetAwaiter().GetResult()
            $stderr = $stderrTask.GetAwaiter().GetResult()
            Write-BoundedOutput -Label "$Name stdout" -Output $stdout
            Write-BoundedOutput -Label "$Name stderr" -Output $stderr
            throw "$Name exceeded its ${effectiveTimeout}-second timeout."
        }

        $stdout = $stdoutTask.GetAwaiter().GetResult()
        $stderr = $stderrTask.GetAwaiter().GetResult()

        if ($process.ExitCode -ne 0) {
            Write-BoundedOutput -Label "$Name stdout" -Output $stdout
            Write-BoundedOutput -Label "$Name stderr" -Output $stderr
            throw "$Name failed with exit code $($process.ExitCode)."
        }

        $results.Add([pscustomobject]@{
            check = $Name
            status = "PASS"
            seconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 1)
        })
    } catch {
        $results.Add([pscustomobject]@{
            check = $Name
            status = "FAIL"
            seconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 1)
        })
        throw
    } finally {
        $stopwatch.Stop()
    }
}

function Add-SkippedResult {
    param(
        [string]$Name,
        [string]$Reason
    )

    Write-Host "[$Name] SKIP - $Reason"
    $results.Add([pscustomobject]@{
        check = $Name
        status = "SKIP"
        seconds = 0
    })
}

function Test-WebApp {
    $webRoot = Join-Path $repoRoot "shopverse-web"

    if ($Install) {
        Invoke-CheckedProcess -Name "web:npm-ci" -WorkingDirectory $webRoot -Command "npm ci" -TimeoutSeconds 240
    }

    if (-not $SkipBrowsers) {
        Invoke-CheckedProcess -Name "web:install-browser" -WorkingDirectory $webRoot -Command "npx playwright install chromium" -TimeoutSeconds 240
    }

    if ($Mode -eq "Full") {
        Invoke-CheckedProcess -Name "web:development-build" -WorkingDirectory $webRoot -Command "npm run build:dev" -TimeoutSeconds 180
    }

    Invoke-CheckedProcess -Name "web:production-build" -WorkingDirectory $webRoot -Command "npm run build" -TimeoutSeconds 240

    Invoke-CheckedProcess -Name "web:unit-tests" -WorkingDirectory $webRoot -Command "npm run test" -TimeoutSeconds 180

    if ($SkipBrowsers) {
        Add-SkippedResult -Name "web:browser-tests" -Reason "Skipped by -SkipBrowsers."
        return
    }

    if ($Mode -eq "Full") {
        Invoke-CheckedProcess -Name "web:e2e" -WorkingDirectory $webRoot -Command "npm run e2e" -TimeoutSeconds 420
    } else {
        Invoke-CheckedProcess -Name "web:e2e-quick" -WorkingDirectory $webRoot -Command "npm run e2e:quick" -TimeoutSeconds 300
    }

    Invoke-CheckedProcess -Name "web:accessibility" -WorkingDirectory $webRoot -Command "npm run a11y" -TimeoutSeconds 300
    Invoke-CheckedProcess -Name "web:lighthouse" -WorkingDirectory $webRoot -Command "npm run lighthouse" -TimeoutSeconds 360
}

function Test-DocumentationSite {
    $docsRoot = Join-Path $repoRoot "documentation"

    if ($Install) {
        Invoke-CheckedProcess -Name "docs:npm-ci" -WorkingDirectory $docsRoot -Command "npm ci" -TimeoutSeconds 300
    }

    Invoke-CheckedProcess -Name "docs:typecheck" -WorkingDirectory $docsRoot -Command "npm run typecheck" -TimeoutSeconds 180

    if ($Mode -eq "Full") {
        Invoke-CheckedProcess -Name "docs:validate-full" -WorkingDirectory $docsRoot -Command "npm run check:docs:full" -TimeoutSeconds 240
    } else {
        Invoke-CheckedProcess -Name "docs:validate-changed" -WorkingDirectory $docsRoot -Command "npm run check:docs:changed" -TimeoutSeconds 120
    }

    Invoke-CheckedProcess -Name "docs:build" -WorkingDirectory $docsRoot -Command "npm run build" -TimeoutSeconds 300
    Invoke-CheckedProcess -Name "docs:performance" -WorkingDirectory $docsRoot -Command "npm run check:performance" -TimeoutSeconds 120

    if ($SkipBrowsers) {
        Add-SkippedResult -Name "docs:playwright" -Reason "Skipped by -SkipBrowsers."
        return
    }

    Invoke-CheckedProcess -Name "docs:install-browser" -WorkingDirectory $docsRoot -Command "npx playwright install chromium" -TimeoutSeconds 240

    if ($Mode -eq "Full") {
        Invoke-CheckedProcess -Name "docs:ui-tests" -WorkingDirectory $docsRoot -Command "npm run test:ui" -TimeoutSeconds 360
    } else {
        Invoke-CheckedProcess -Name "docs:changed-ui-tests" -WorkingDirectory $docsRoot -Command "npm run test:changed" -TimeoutSeconds 240
    }
}

try {
    if ($Target -in @("Web", "All")) {
        Test-WebApp
    }

    if ($Target -in @("Docs", "All")) {
        Test-DocumentationSite
    }
} finally {
    Write-Host ""
    Write-Host "Frontend site verification summary"
    $results | Format-Table -AutoSize
}
