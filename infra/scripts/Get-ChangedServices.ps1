[CmdletBinding()]
param(
    [string]$BaseRef = "",
    [switch]$IncludeAllWhenSharedChanges
)

$servicePaths = [ordered]@{
    "config-server" = "services/config-server"
    "discovery-server" = "services/discovery-server"
    "user-service" = "services/user-service"
    "auth-service" = "services/auth-service"
    "order-service" = "services/order-service"
    "payment-service" = "services/payment-service"
    "inventory-service" = "services/inventory-service"
    "api-gateway" = "services/api-gateway"
}

$allServices = @($servicePaths.Keys)
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

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
        "^infra/cloud-configs/",
        "^docker-compose",
        "^infra/docker/",
        "^infra/observability/",
        "^infra/scripts/",
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
