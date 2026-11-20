param([switch]$IncludeAnalytics)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$compose = Join-Path $root 'compose.yml'

function Invoke-Compose([string[]]$Arguments) {
  & docker compose -f $compose @Arguments
  if ($LASTEXITCODE -ne 0) { throw "docker compose failed: $Arguments" }
}
function Query([string]$Service, [string]$Database, [string]$Sql) {
  $value = & docker compose -f $compose exec -T $Service psql -U lab -d $Database -v ON_ERROR_STOP=1 -Atc $Sql
  if ($LASTEXITCODE -ne 0) { throw "Query failed: $Sql" }
  return ($value | Out-String).Trim()
}
function Assert-Equal([string]$Expected, [string]$Actual, [string]$Message) {
  if ($Expected -ne $Actual) { throw "$Message. Expected '$Expected', got '$Actual'." }
  Write-Host "PASS: $Message"
}

try {
  Invoke-Compose @('up', '-d', '--wait', 'postgres', 'restore')
  Invoke-Compose @('exec', '-T', 'postgres', 'psql', '-U', 'lab', '-d', 'dbops', '-v', 'ON_ERROR_STOP=1', '-f', '/lab/sql/001-expand.sql')
  Invoke-Compose @('exec', '-T', 'postgres', 'psql', '-U', 'lab', '-d', 'dbops', '-v', 'ON_ERROR_STOP=1', '-f', '/lab/sql/002-backfill-and-index.sql')
  Invoke-Compose @('exec', '-T', 'postgres', 'psql', '-U', 'lab', '-d', 'dbops', '-v', 'ON_ERROR_STOP=1', '-f', '/lab/sql/003-retention-cdc.sql')

  Assert-Equal '10000' (Query 'postgres' 'dbops' 'SELECT count(*) FROM customer_order') 'seed count'
  Assert-Equal '0' (Query 'postgres' 'dbops' 'SELECT count(*) FROM customer_order WHERE public_reference IS NULL') 'backfill completeness'
  Assert-Equal '1' (Query 'postgres' 'dbops' "SELECT count(*) FROM pg_indexes WHERE indexname='ix_customer_order_customer_created'") 'online index exists'

  Invoke-Compose @('exec', '-T', 'postgres', 'sh', '-c', 'pg_dump -U lab -d dbops -Fc -f /backup/dbops.dump')
  Invoke-Compose @('exec', '-T', 'restore', 'sh', '-c', 'pg_restore -U lab -d restore --clean --if-exists /backup/dbops.dump')
  $sourceHash = Query 'postgres' 'dbops' "SELECT md5(string_agg(id||':'||public_reference, ',' ORDER BY id)) FROM customer_order"
  $restoreHash = Query 'restore' 'restore' "SELECT md5(string_agg(id||':'||public_reference, ',' ORDER BY id)) FROM customer_order"
  Assert-Equal $sourceHash $restoreHash 'restored data checksum'

  Query 'postgres' 'dbops' "INSERT INTO operational_event(occurred_at,event_type,payload) VALUES ('2026-07-12T01:00:00Z','ORDER_COMPLETED',jsonb_build_object('orderId',2))" | Out-Null
  $cdc = Query 'postgres' 'dbops' "SELECT count(*) FROM pg_logical_slot_get_changes('dbops_lab_slot', NULL, NULL) WHERE data LIKE '%operational_event%'"
  if ([int]$cdc -lt 1) { throw 'Logical CDC produced no operational_event change.' }
  Write-Host 'PASS: logical CDC emitted committed changes'

  if ($IncludeAnalytics) {
    Invoke-Compose @('--profile', 'analytics', 'up', '-d', '--wait', 'clickhouse')
    $events = Query 'postgres' 'dbops' "SELECT event_type||','||(payload->>'amountCents') FROM operational_event WHERE payload ? 'amountCents'"
    & docker compose -f $compose exec -T clickhouse clickhouse-client --query 'CREATE TABLE IF NOT EXISTS order_event(event_type String, amount_cents UInt64) ENGINE=MergeTree ORDER BY event_type'
    if ($LASTEXITCODE -ne 0) { throw 'ClickHouse table creation failed.' }
    $events | & docker compose -f $compose exec -T clickhouse clickhouse-client --query 'INSERT INTO order_event FORMAT CSV'
    if ($LASTEXITCODE -ne 0) { throw 'ClickHouse projection ingestion failed.' }
    $result = & docker compose -f $compose exec -T clickhouse clickhouse-client --query 'SELECT sum(amount_cents) FROM order_event FORMAT TabSeparatedRaw'
    if ($LASTEXITCODE -ne 0 -or ($result | Select-Object -Last 1) -ne '1001') { throw 'ClickHouse projection assertion failed.' }
    Write-Host 'PASS: OLTP event projected into ClickHouse'
  }
  Write-Host 'Database operations lab passed.'
} catch {
  Write-Error $_
  exit 1
}
