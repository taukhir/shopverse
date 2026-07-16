[CmdletBinding()]
param(
    [ValidateRange(1, 20)]
    [int]$CustomerCount = 20,

    [ValidateRange(1, 20)]
    [int]$ProductCount = 20,

    [ValidateRange(1, 500)]
    [int]$OrderCount = 50,

    [ValidateRange(5, 120)]
    [int]$TimeoutMinutes = 35,

    [switch]$SkipBuild,

    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$gatewayUrl = "http://localhost:8080"
$startedAt = [DateTimeOffset]::UtcNow
$deadline = $startedAt.AddMinutes($TimeoutMinutes)

function Get-RemainingSeconds {
    return [math]::Max(1, [math]::Floor(($deadline - [DateTimeOffset]::UtcNow).TotalSeconds))
}

function Import-DotEnvValue {
    param([string]$Name)

    if ([Environment]::GetEnvironmentVariable($Name, "Process")) {
        return
    }

    $envPath = Join-Path $repoRoot ".env"
    if (-not (Test-Path -LiteralPath $envPath)) {
        return
    }

    $match = Get-Content -LiteralPath $envPath |
        Where-Object { $_ -match "^\s*$([regex]::Escape($Name))=(.*)\s*$" } |
        Select-Object -First 1
    if ($match -match "^\s*$([regex]::Escape($Name))=(.*)\s*$") {
        [Environment]::SetEnvironmentVariable($Name, $Matches[1].Trim('"').Trim("'"), "Process")
    }
}

function Invoke-Compose {
    param([string[]]$Arguments)

    Push-Location $repoRoot
    try {
        & docker compose --profile apps --profile assets @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "docker compose $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }
}

Import-DotEnvValue -Name "SHOPVERSE_ADMIN_PASSWORD"

Write-Host "Stopping Shopverse and removing local Compose volumes..."
Invoke-Compose -Arguments @("down", "-v", "--remove-orphans", "--timeout", "10")

$upArguments = @("up", "-d")
if (-not $SkipBuild) {
    $upArguments += "--build"
}

Write-Host "Starting fresh Shopverse stack..."
Invoke-Compose -Arguments $upArguments

Write-Host "Waiting for API Gateway readiness..."
& (Join-Path $PSScriptRoot "Wait-Service.ps1") `
    -Uri "$gatewayUrl/actuator/shopverse-readiness" `
    -TimeoutSeconds ([math]::Min(240, (Get-RemainingSeconds))) | Out-Null

if (-not $SkipSeed) {
    Write-Host "Seeding clean users, inventory, and orders..."
    & (Join-Path $PSScriptRoot "Seed-ShopverseData.ps1") `
        -GatewayUrl $gatewayUrl `
        -CustomerCount $CustomerCount `
        -ProductCount $ProductCount `
        -OrderCount $OrderCount
}

$finishedAt = [DateTimeOffset]::UtcNow
[pscustomobject]@{
    status = "completed"
    gatewayUrl = $gatewayUrl
    customerCount = if ($SkipSeed) { 0 } else { $CustomerCount }
    productCount = if ($SkipSeed) { 0 } else { $ProductCount }
    orderCount = if ($SkipSeed) { 0 } else { $OrderCount }
    durationSeconds = [math]::Round(($finishedAt - $startedAt).TotalSeconds, 1)
}
