[CmdletBinding()]
param(
    [string]$GatewayUrl = "http://localhost:8080",
    [string]$Username = "admin",
    [string]$Password = "Admin@123",
    [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMddHHmmssfff"
$correlationId = "smoke-$stamp"
$idempotencyKey = "smoke-checkout-$stamp"

$login = Invoke-RestMethod `
    -Method Post `
    -Uri "$GatewayUrl/auth/login" `
    -ContentType "application/json" `
    -Body (@{ username = $Username; password = $Password } | ConvertTo-Json) `
    -TimeoutSec 10

if (-not $login.token) {
    throw "Login succeeded without returning a JWT token."
}

$headers = @{
    Authorization = "Bearer $($login.token)"
    "X-Correlation-Id" = $correlationId
    "Idempotency-Key" = $idempotencyKey
}

$requestBody = @{
    items = @(
        @{
            productId = 101
            quantity = 1
        }
    )
} | ConvertTo-Json -Depth 5

$checkoutDeadline = [DateTimeOffset]::UtcNow.AddSeconds($TimeoutSeconds)
do {
    try {
        $order = Invoke-RestMethod `
            -Method Post `
            -Uri "$GatewayUrl/api/v1/orders/checkout" `
            -Headers $headers `
            -ContentType "application/json" `
            -Body $requestBody `
            -TimeoutSec 10
        break
    } catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -ne 503 -or [DateTimeOffset]::UtcNow -ge $checkoutDeadline) {
            throw
        }

        Start-Sleep -Seconds 1
    }
} while ([DateTimeOffset]::UtcNow -lt $checkoutDeadline)

if (-not $order) {
    throw "Checkout route did not become available within ${TimeoutSeconds}s."
}

$deadline = [DateTimeOffset]::UtcNow.AddSeconds($TimeoutSeconds)
do {
    $current = Invoke-RestMethod `
        -Uri "$GatewayUrl/api/v1/orders/$($order.id)" `
        -Headers @{ Authorization = "Bearer $($login.token)" } `
        -TimeoutSec 5

    if ($current.status -eq "CONFIRMED") {
        break
    }

    if ($current.status -in @("INVENTORY_REJECTED", "PAYMENT_FAILED", "CANCELLED")) {
        throw "Checkout $($current.orderNumber) reached terminal failure state $($current.status)."
    }

    Start-Sleep -Milliseconds 500
} while ([DateTimeOffset]::UtcNow -lt $deadline)

if ($current.status -ne "CONFIRMED") {
    throw "Checkout $($order.orderNumber) did not reach CONFIRMED within ${TimeoutSeconds}s. Last state: $($current.status)"
}

$timeline = Invoke-RestMethod `
    -Uri "$GatewayUrl/api/v1/orders/$($order.id)/timeline" `
    -Headers @{ Authorization = "Bearer $($login.token)" } `
    -TimeoutSec 5

$expectedStages = @(
    "ORDER_CREATED",
    "INVENTORY_RESERVED",
    "PAYMENT_PROCESSING",
    "PAYMENT_COMPLETED",
    "ORDER_CONFIRMED"
)
$actualStages = @($timeline.stage)
$missingStages = @($expectedStages | Where-Object { $_ -notin $actualStages })

if ($missingStages) {
    throw "Checkout timeline is missing stages: $($missingStages -join ', ')"
}

[pscustomobject]@{
    passed = $true
    orderId = $current.id
    orderNumber = $current.orderNumber
    status = $current.status
    correlationId = $correlationId
    durationLimitSeconds = $TimeoutSeconds
}
