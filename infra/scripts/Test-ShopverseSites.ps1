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

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
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
    # The Docusaurus documentation site moved to its own repository,
    # taukhir/shopverse-docs, which has its own build/test/CI pipeline.
    # There is nothing to verify here anymore; this repository only keeps
    # plain Shopverse-specific Markdown under docs/.
    Add-SkippedResult -Name "docs:all" -Reason "Documentation site moved to github.com/taukhir/shopverse-docs; verify it there."
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
