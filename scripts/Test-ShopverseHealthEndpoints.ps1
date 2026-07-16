[CmdletBinding()]
param(
    [ValidateRange(5, 300)]
    [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = "Stop"

$checks = @(
    @{ Name = "config-server"; Uri = "http://127.0.0.1:8888/actuator/health" },
    @{ Name = "discovery-server"; Uri = "http://127.0.0.1:8761/actuator/health" },
    @{ Name = "auth-service"; Uri = "http://127.0.0.1:8081/actuator/health" },
    @{ Name = "user-service"; Uri = "http://127.0.0.1:8082/actuator/health" },
    @{ Name = "order-service"; Uri = "http://127.0.0.1:8083/actuator/health" },
    @{ Name = "payment-service"; Uri = "http://127.0.0.1:8084/actuator/health" },
    @{ Name = "inventory-service"; Uri = "http://127.0.0.1:8086/actuator/health" },
    @{ Name = "api-gateway"; Uri = "http://127.0.0.1:8080/actuator/health" }
)

$results = [System.Collections.Generic.List[object]]::new()
$perServiceTimeout = [math]::Max(5, [math]::Floor($TimeoutSeconds / $checks.Count))

foreach ($check in $checks) {
    $stopwatch = [Diagnostics.Stopwatch]::StartNew()
    try {
        & (Join-Path $PSScriptRoot "Wait-Service.ps1") `
            -Uri $check.Uri `
            -TimeoutSeconds $perServiceTimeout | Out-Null
        $results.Add([pscustomobject]@{
            service = $check.Name
            status = "UP"
            uri = $check.Uri
            seconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 1)
        })
    } catch {
        $results.Add([pscustomobject]@{
            service = $check.Name
            status = "FAIL"
            uri = $check.Uri
            seconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 1)
        })
        throw
    } finally {
        $stopwatch.Stop()
    }
}

$results | Format-Table -AutoSize
