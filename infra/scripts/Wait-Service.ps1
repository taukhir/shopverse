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
        $output = @(& curl.exe `
            --silent `
            --show-error `
            --max-time 5 `
            --write-out "`n%{http_code}" `
            $Uri 2>&1)
        $curlExitCode = $LASTEXITCODE
        if ($curlExitCode -eq 0 -and $output.Count -ge 1) {
            $statusCode = [int]$output[-1]
            $content = ($output[0..([math]::Max(0, $output.Count - 2))] -join [Environment]::NewLine)
            if ($statusCode -ge 200 -and $statusCode -lt 300) {
                if ([string]::IsNullOrWhiteSpace($ExpectedPattern) -or $content -match $ExpectedPattern) {
                    return [pscustomobject]@{
                        StatusCode = $statusCode
                        Content = $content
                    }
                }
            }
        } else {
            $lastError = ($output -join [Environment]::NewLine)
        }
    } catch {
        $lastError = $_.Exception.Message
    }

    Start-Sleep -Milliseconds $IntervalMilliseconds
}

$detail = if ($lastError) { " Last error: $lastError" } else { "" }
throw "Timed out after ${TimeoutSeconds}s waiting for $Uri.$detail"
