[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Uri,

    [int]$TimeoutSeconds = 60,

    [int]$IntervalMilliseconds = 500,

    [string]$ExpectedPattern = '"status"\s*:\s*"UP"'
)

$deadline = [DateTimeOffset]::UtcNow.AddSeconds($TimeoutSeconds)
$lastError = $null

while ([DateTimeOffset]::UtcNow -lt $deadline) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec 5
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            if ([string]::IsNullOrWhiteSpace($ExpectedPattern) -or $response.Content -match $ExpectedPattern) {
                return $response
            }
        }
    } catch {
        $lastError = $_.Exception.Message
    }

    Start-Sleep -Milliseconds $IntervalMilliseconds
}

$detail = if ($lastError) { " Last error: $lastError" } else { "" }
throw "Timed out after ${TimeoutSeconds}s waiting for $Uri.$detail"
