[CmdletBinding()]
param(
    [string]$BaseRef = "",
    [switch]$IncludeAllWhenSharedChanges
)

$servicePaths = [ordered]@{
    "config-server" = "config-server"
    "discovery-server" = "discovery-server"
    "user-service" = "user-service"
    "auth-service" = "auth-service"
    "order-service" = "order-service"
    "payment-service" = "payment-service"
    "inventory-service" = "inventory-service"
    "api-gateway" = "api-gateway"
}

$allServices = @($servicePaths.Keys)
$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot
try {
    $gitArgs = @("-c", "safe.directory=$($repoRoot.Replace('\', '/'))", "diff", "--name-only")
    if ($BaseRef) {
        $gitArgs += "$BaseRef...HEAD"
    } else {
        $gitArgs += "HEAD"
    }

    $changedFiles = @(& git @gitArgs 2>$null)
    $changedFiles += @(& git -c "safe.directory=$($repoRoot.Replace('\', '/'))" ls-files --others --exclude-standard 2>$null)
    $changedFiles = @($changedFiles | Where-Object { $_ } | Sort-Object -Unique)

    if (-not $changedFiles) {
        return @()
    }

    $sharedPatterns = @(
        "^cloud-configs/",
        "^docker-compose",
        "^docker/",
        "^observability/",
        "^scripts/",
        "^\.github/workflows/"
    )

    $sharedChanged = $changedFiles | Where-Object {
        $path = $_.Replace('\', '/')
        $sharedPatterns | Where-Object { $path -match $_ }
    }

    if ($IncludeAllWhenSharedChanges -and $sharedChanged) {
        return $allServices
    }

    $changedServices = foreach ($entry in $servicePaths.GetEnumerator()) {
        $prefix = "$($entry.Value)/"
        if ($changedFiles | Where-Object { $_.Replace('\', '/').StartsWith($prefix) }) {
            $entry.Key
        }
    }

    return @($changedServices | Sort-Object -Unique)
} finally {
    Pop-Location
}
