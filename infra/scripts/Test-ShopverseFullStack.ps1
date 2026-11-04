[CmdletBinding()]
param(
    [ValidateSet("Smoke", "Full")]
    [string]$Mode = "Smoke",

    [ValidateRange(5, 120)]
    [int]$TimeoutMinutes = 35,

    [switch]$Install,

    [switch]$SkipBrowser,

    [switch]$SkipDocs,

    [switch]$KeepStack
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$startedAt = [DateTimeOffset]::UtcNow
$deadline = $startedAt.AddMinutes($TimeoutMinutes)
$projectName = "shopverse-fullstack-$PID"
$gatewayUrl = "http://127.0.0.1:18080"
$webUrl = "http://127.0.0.1:14200"
$docsUrl = "http://127.0.0.1:13001"
$results = [System.Collections.Generic.List[object]]::new()
$dockerAvailable = $false
$composeArgumentsPrefix = @(
    "--profile", "apps",
    "--profile", "assets",
    "-f", "docker-compose.yml",
    "-f", "docker-compose.test.yml",
    "-f", "docker-compose.full-stack.yml",
    "-f", "docker-compose.full-stack-test.yml"
)

function Assert-WithinDeadline {
    if ([DateTimeOffset]::UtcNow -ge $deadline) {
        throw "Full-stack verification exceeded the ${TimeoutMinutes}-minute timeout."
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
    $startInfo.Arguments = $Arguments -join " "
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
        $timeoutSeconds = Get-RemainingSeconds
        if (-not $process.WaitForExit($timeoutSeconds * 1000)) {
            & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
            $process.WaitForExit()
            $stdout = $stdoutTask.GetAwaiter().GetResult()
            $stderr = $stderrTask.GetAwaiter().GetResult()
            Write-BoundedOutput -Label "$Name stdout" -Output $stdout
            Write-BoundedOutput -Label "$Name stderr" -Output $stderr
            throw "$Name exceeded its ${timeoutSeconds}-second timeout."
        }

        $stdout = $stdoutTask.GetAwaiter().GetResult()
        $stderr = $stderrTask.GetAwaiter().GetResult()
        if ($process.ExitCode -ne 0) {
            Write-BoundedOutput -Label "$Name stdout" -Output $stdout
            Write-BoundedOutput -Label "$Name stderr" -Output $stderr
            throw "$Name failed with exit code $($process.ExitCode)."
        }

        if ($ShowOutput) {
            Write-BoundedOutput -Label "$Name stdout" -Output $stdout
            Write-BoundedOutput -Label "$Name stderr" -Output $stderr
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

function Invoke-Compose {
    param(
        [string]$Name,
        [string[]]$Arguments,
        [switch]$ShowOutput
    )

    Invoke-CheckedProcess `
        -Name $Name `
        -FilePath "docker" `
        -Arguments (@("compose") + $composeArgumentsPrefix + $Arguments) `
        -WorkingDirectory $repoRoot `
        -ShowOutput:$ShowOutput
}

function Add-Result {
    param(
        [string]$Name,
        [string]$Detail = ""
    )

    $results.Add([pscustomobject]@{
        check = $Name
        status = "PASS"
        seconds = [math]::Round(([DateTimeOffset]::UtcNow - $startedAt).TotalSeconds, 1)
        detail = $Detail
    })
}

function Assert-DockerAvailable {
    try {
        Invoke-CheckedProcess `
            -Name "docker-preflight" `
            -FilePath "docker" `
            -Arguments @("info", "--format", "{{.ServerVersion}}") `
            -WorkingDirectory $repoRoot
        $script:dockerAvailable = $true
    } catch {
        throw "Docker is not available. Start Docker Desktop, wait until the Linux engine is running, then rerun Test-ShopverseFullStack.ps1."
    }
}

function Set-TestEnvironment {
    $env:COMPOSE_PROJECT_NAME = $projectName
    $env:COMPOSE_PARALLEL_LIMIT = "2"
    $env:COMPOSE_BAKE = "false"
    if (-not $env:MYSQL_PASSWORD) { $env:MYSQL_PASSWORD = "shopverse-test-password" }
    if (-not $env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD = "shopverse-test-root-password" }
    if (-not $env:MINIO_ROOT_USER) { $env:MINIO_ROOT_USER = "shopverse-test-minio" }
    if (-not $env:MINIO_ROOT_PASSWORD) { $env:MINIO_ROOT_PASSWORD = "shopverse-test-minio-password" }
    if (-not $env:GRAFANA_ADMIN_PASSWORD) { $env:GRAFANA_ADMIN_PASSWORD = "shopverse-test-grafana-password" }
    $env:SHOPVERSE_WEB_TEST_PORT = "14200"
    $env:SHOPVERSE_DOCS_TEST_PORT = "13001"
}

function Clear-TestEnvironment {
    "COMPOSE_PROJECT_NAME",
    "COMPOSE_PARALLEL_LIMIT",
    "COMPOSE_BAKE",
    "SHOPVERSE_WEB_TEST_PORT",
    "SHOPVERSE_DOCS_TEST_PORT" |
        ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
}

$verificationError = $null
Set-TestEnvironment

Push-Location $repoRoot
try {
    Assert-DockerAvailable

    $services = @(
        "mysql",
        "mysql-bootstrap",
        "kafka",
        "minio",
        "minio-init",
        "config-server",
        "discovery-server",
        "user-service",
        "auth-service",
        "order-service",
        "payment-service",
        "inventory-service",
        "api-gateway",
        "shopverse-web"
    )

    if (-not $SkipDocs) {
        $services += "documentation"
    }

    Invoke-Compose -Name "compose-config" -Arguments @("config", "--quiet")
    Invoke-Compose -Name "compose-up" -Arguments (@("up", "-d", "--build") + $services)

    & (Join-Path $PSScriptRoot "Wait-Service.ps1") `
        -Uri "$gatewayUrl/actuator/health" `
        -TimeoutSeconds ([math]::Min(240, (Get-RemainingSeconds))) | Out-Null
    Add-Result -Name "gateway-health" -Detail $gatewayUrl

    & (Join-Path $PSScriptRoot "Wait-Service.ps1") `
        -Uri "$gatewayUrl/actuator/shopverse-readiness" `
        -TimeoutSeconds ([math]::Min(180, (Get-RemainingSeconds))) | Out-Null
    Add-Result -Name "shopverse-readiness" -Detail "$gatewayUrl/actuator/shopverse-readiness"

    & (Join-Path $PSScriptRoot "Wait-Service.ps1") `
        -Uri $webUrl `
        -TimeoutSeconds ([math]::Min(120, (Get-RemainingSeconds))) `
        -ExpectedPattern "shopverse|ShopVerse" | Out-Null
    Add-Result -Name "web-health" -Detail $webUrl

    if (-not $SkipDocs) {
        & (Join-Path $PSScriptRoot "Wait-Service.ps1") `
            -Uri $docsUrl `
            -TimeoutSeconds ([math]::Min(120, (Get-RemainingSeconds))) `
            -ExpectedPattern "Backend Engineering|Shopverse|Docusaurus" | Out-Null
        Add-Result -Name "docs-health" -Detail $docsUrl
    }

    $smoke = & (Join-Path $PSScriptRoot "Smoke-Test.ps1") -GatewayUrl $gatewayUrl -TimeoutSeconds 60
    Add-Result -Name "api-saga-smoke" -Detail $smoke.orderNumber

    if (-not $SkipBrowser) {
        $webRoot = Join-Path $repoRoot "shopverse-web"
        if ($Install) {
            Invoke-CheckedProcess -Name "web:npm-ci" -FilePath "npm.cmd" -Arguments @("ci") -WorkingDirectory $webRoot
        }

        Invoke-CheckedProcess `
            -Name "web:install-browser" `
            -FilePath "node" `
            -Arguments @(".\node_modules\playwright\cli.js", "install", "chromium") `
            -WorkingDirectory $webRoot

        $previousFullStack = $env:SHOPVERSE_FULL_STACK
        $previousBaseUrl = $env:SHOPVERSE_WEB_BASE_URL
        try {
            $env:SHOPVERSE_FULL_STACK = "1"
            $env:SHOPVERSE_WEB_BASE_URL = $webUrl
            Invoke-CheckedProcess `
                -Name "web:full-stack-e2e" `
                -FilePath "node" `
                -Arguments @(".\node_modules\@playwright\test\cli.js", "test", "tests/e2e/full-stack-smoke.spec.ts", "--project=chromium") `
                -WorkingDirectory $webRoot
        } finally {
            if ($null -eq $previousFullStack) { Remove-Item Env:SHOPVERSE_FULL_STACK -ErrorAction SilentlyContinue } else { $env:SHOPVERSE_FULL_STACK = $previousFullStack }
            if ($null -eq $previousBaseUrl) { Remove-Item Env:SHOPVERSE_WEB_BASE_URL -ErrorAction SilentlyContinue } else { $env:SHOPVERSE_WEB_BASE_URL = $previousBaseUrl }
        }
    }

    if ($Mode -eq "Full") {
        & (Join-Path $PSScriptRoot "Smoke-Test.ps1") `
            -GatewayUrl $gatewayUrl `
            -Username "customer1" `
            -Password "Customer@123" `
            -TimeoutSeconds 60 | Out-Null
        Add-Result -Name "customer-api-smoke"
    }
} catch {
    $verificationError = $_
    if ($dockerAvailable) {
        Write-Host "Full-stack verification failed. Collecting bounded diagnostics."
        try { Invoke-Compose -Name "compose-ps" -Arguments @("ps") -ShowOutput } catch { Write-Warning $_.Exception.Message }
        try { Invoke-Compose -Name "compose-logs" -Arguments @("logs", "--tail=160") -ShowOutput } catch { Write-Warning $_.Exception.Message }
    }
} finally {
    if ($dockerAvailable -and -not $KeepStack) {
        try { Invoke-Compose -Name "compose-down" -Arguments @("down", "-v", "--remove-orphans", "--timeout", "10") | Out-Null } catch { Write-Warning $_.Exception.Message }
    } elseif ($dockerAvailable) {
        Write-Host "Keeping stack for inspection. COMPOSE_PROJECT_NAME=$projectName"
    }
    Pop-Location
    Clear-TestEnvironment

    Write-Host ""
    Write-Host "Shopverse full-stack verification: $Mode"
    $results | Format-Table -AutoSize
    Write-Host "Total duration: $([math]::Round(([DateTimeOffset]::UtcNow - $startedAt).TotalSeconds, 1))s"
}

if ($verificationError) {
    throw $verificationError
}
