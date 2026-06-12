[CmdletBinding()]
param(
    [ValidateSet("Quick", "Changed", "Integration", "Full")]
    [string]$Mode = "Quick",

    [string[]]$Services = @(),

    [string]$BaseRef = "",

    [int]$TimeoutMinutes = 10,

    [switch]$KeepStack,

    [switch]$ForceIsolatedStack
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$commerceServices = @("order-service", "inventory-service", "payment-service")
$runtimeServices = @(
    "mysql",
    "mysql-bootstrap",
    "kafka",
    "config-server",
    "discovery-server",
    "user-service",
    "auth-service",
    "order-service",
    "payment-service",
    "inventory-service",
    "api-gateway"
)
$allServices = @(
    "config-server",
    "discovery-server",
    "user-service",
    "auth-service",
    "order-service",
    "payment-service",
    "inventory-service",
    "api-gateway"
)
$startedAt = [DateTimeOffset]::UtcNow
$deadline = $startedAt.AddMinutes($TimeoutMinutes)
$results = [System.Collections.Generic.List[object]]::new()

function Initialize-Java {
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
        return
    }

    if (Get-Command java -ErrorAction SilentlyContinue) {
        return
    }

    $jdk = Get-ChildItem -Path (Join-Path $env:USERPROFILE ".jdks") -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match "21" -and (Test-Path (Join-Path $_.FullName "bin\java.exe")) } |
        Sort-Object Name -Descending |
        Select-Object -First 1

    if (-not $jdk) {
        throw "Java 21 was not found. Set JAVA_HOME before running verification."
    }

    $env:JAVA_HOME = $jdk.FullName
    $env:PATH = "$($jdk.FullName)\bin;$env:PATH"
}

function Assert-WithinDeadline {
    if ([DateTimeOffset]::UtcNow -ge $deadline) {
        throw "Verification exceeded the ${TimeoutMinutes}-minute overall timeout."
    }
}

function Invoke-BoundedProcess {
    param(
        [Parameter(Mandatory)]
        [string]$FilePath,
        [string[]]$Arguments = @(),
        [Parameter(Mandatory)]
        [string]$WorkingDirectory,
        [Parameter(Mandatory)]
        [string]$DisplayName
    )

    Assert-WithinDeadline
    $remainingMilliseconds = [math]::Max(
        1,
        [math]::Floor(($deadline - [DateTimeOffset]::UtcNow).TotalMilliseconds)
    )
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $FilePath
    $startInfo.Arguments = $Arguments -join " "
    $startInfo.WorkingDirectory = $WorkingDirectory
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true

    $process = [System.Diagnostics.Process]::Start($startInfo)
    $null = $process.Handle

    if (-not $process.WaitForExit($remainingMilliseconds)) {
        & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
        throw "$DisplayName exceeded the remaining verification deadline and was terminated."
    }

    $process.WaitForExit()
    $process.Refresh()
    if ($process.ExitCode -ne 0) {
        throw "$DisplayName failed with exit code $($process.ExitCode)."
    }
}

function Invoke-GradleTask {
    param(
        [string]$Service,
        [string]$Task
    )

    Assert-WithinDeadline
    $servicePath = Join-Path $repoRoot $Service
    $stopwatch = [Diagnostics.Stopwatch]::StartNew()
    Write-Host "[$Service] Running $Task"

    try {
        Invoke-BoundedProcess `
            -FilePath "cmd.exe" `
            -Arguments @("/d", "/s", "/c", "gradlew.bat $Task --no-daemon --max-workers=2") `
            -WorkingDirectory $servicePath `
            -DisplayName "$Service Gradle task '$Task'"
    } finally {
        $stopwatch.Stop()
    }

    $results.Add([pscustomobject]@{
        check = "${Service}:$Task"
        status = "PASS"
        seconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 1)
    })
}

if ($Mode -ne "Full") {
    Initialize-Java
}

if (-not $Services) {
    if ($Mode -eq "Changed") {
        $Services = @(& (Join-Path $PSScriptRoot "Get-ChangedServices.ps1") `
            -BaseRef $BaseRef `
            -IncludeAllWhenSharedChanges)
        if (-not $Services) {
            Write-Host "No changed services detected."
            return
        }
    } elseif ($Mode -eq "Integration") {
        $Services = $commerceServices
    } else {
        $Services = $allServices
    }
}

$invalidServices = @($Services | Where-Object { $_ -notin $allServices })
if ($invalidServices) {
    throw "Unknown services: $($invalidServices -join ', ')"
}

Push-Location $repoRoot
try {
    switch ($Mode) {
        "Quick" {
            foreach ($service in $Services) {
                Invoke-GradleTask -Service $service -Task "test"
            }
        }
        "Changed" {
            foreach ($service in $Services) {
                Invoke-GradleTask -Service $service -Task "test"
            }
        }
        "Integration" {
            foreach ($service in @($Services | Where-Object { $_ -in $commerceServices })) {
                Invoke-GradleTask -Service $service -Task "integrationTest"
            }
        }
        "Full" {
            if (-not $ForceIsolatedStack) {
                $runningGatewayHealthy = $false
                try {
                    $runningGateway = Invoke-RestMethod `
                        -Uri "http://localhost:8080/actuator/health" `
                        -TimeoutSec 3
                    $runningGatewayHealthy = $runningGateway.status -eq "UP"
                } catch {
                    Write-Host "No healthy development stack detected; starting an isolated verification stack."
                }

                if ($runningGatewayHealthy) {
                    Write-Host "Healthy development stack detected; running the SAGA smoke test without duplicating containers."
                    $smokeResult = & (Join-Path $PSScriptRoot "Smoke-Test.ps1")
                    $results.Add([pscustomobject]@{
                        check = "running-stack-saga-smoke"
                        status = "PASS"
                        seconds = [math]::Round(([DateTimeOffset]::UtcNow - $startedAt).TotalSeconds, 1)
                        detail = $smokeResult.orderNumber
                    })
                    break
                }
            }

            $projectName = "shopverse-verify-$PID"
            $env:COMPOSE_PROJECT_NAME = $projectName
            $env:COMPOSE_PARALLEL_LIMIT = "2"
            $env:COMPOSE_BAKE = "false"
            if (-not $env:MYSQL_PASSWORD) {
                $env:MYSQL_PASSWORD = "shopverse-test-password"
            }
            if (-not $env:MYSQL_ROOT_PASSWORD) {
                $env:MYSQL_ROOT_PASSWORD = "shopverse-test-root-password"
            }
            if (-not $env:GRAFANA_ADMIN_PASSWORD) {
                $env:GRAFANA_ADMIN_PASSWORD = "shopverse-test-grafana-password"
            }
            try {
                $composeArguments = @(
                    "compose",
                    "-f", "docker-compose.yml",
                    "-f", "docker-compose.test.yml",
                    "up", "-d", "--build"
                ) + $runtimeServices
                Invoke-BoundedProcess `
                    -FilePath "docker" `
                    -Arguments $composeArguments `
                    -WorkingDirectory $repoRoot `
                    -DisplayName "Docker Compose startup"

                & (Join-Path $PSScriptRoot "Wait-Service.ps1") `
                    -Uri "http://localhost:18080/actuator/health" `
                    -TimeoutSeconds ([math]::Min(180, $TimeoutMinutes * 60))

                $smokeResult = & (Join-Path $PSScriptRoot "Smoke-Test.ps1") `
                    -GatewayUrl "http://localhost:18080"
                $results.Add([pscustomobject]@{
                    check = "docker-saga-smoke"
                    status = "PASS"
                    seconds = [math]::Round(([DateTimeOffset]::UtcNow - $startedAt).TotalSeconds, 1)
                    detail = $smokeResult.orderNumber
                })
            } catch {
                Write-Host "Verification failed. Collecting bounded diagnostics."
                & docker compose -f docker-compose.yml -f docker-compose.test.yml ps
                & docker compose -f docker-compose.yml -f docker-compose.test.yml logs --tail=120
                throw
            } finally {
                if (-not $KeepStack) {
                    & docker compose -f docker-compose.yml -f docker-compose.test.yml down -v --remove-orphans --timeout 10
                }
                Remove-Item Env:COMPOSE_PROJECT_NAME -ErrorAction SilentlyContinue
                Remove-Item Env:COMPOSE_PARALLEL_LIMIT -ErrorAction SilentlyContinue
                Remove-Item Env:COMPOSE_BAKE -ErrorAction SilentlyContinue
            }
        }
    }
} finally {
    Pop-Location
}

$elapsed = [math]::Round(([DateTimeOffset]::UtcNow - $startedAt).TotalSeconds, 1)
Write-Host ""
Write-Host "Shopverse verification: $Mode"
$results | Format-Table -AutoSize
Write-Host "Total duration: ${elapsed}s"
