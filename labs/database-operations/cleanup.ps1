$ErrorActionPreference = 'Stop'
docker compose -f (Join-Path $PSScriptRoot 'compose.yml') --profile analytics down --volumes --remove-orphans
if ($LASTEXITCODE -ne 0) { throw 'Database operations lab cleanup failed.' }
