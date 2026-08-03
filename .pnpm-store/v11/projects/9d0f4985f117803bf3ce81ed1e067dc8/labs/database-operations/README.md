# Database Operations Lab

This disposable lab demonstrates expand/contract schema migration, bounded
backfill, online index creation, backup/restore verification, logical CDC, data
retention, and an OLTP-to-ClickHouse projection.

Prerequisites: Docker Compose v2 and PowerShell 7 (`pwsh`). Do not point any lab
script at a non-lab database. Containers use project name `shopverse-dbops-lab`
and host ports `25432`, `25433`, and `28123`.

```powershell
pwsh ./run-lab.ps1
pwsh ./run-lab.ps1 -IncludeAnalytics
pwsh ./cleanup.ps1
```

The runner:

1. starts isolated PostgreSQL primary and restore targets;
2. applies expand, deploy/backfill, and contract-compatible migrations;
3. verifies row counts and the new index;
4. creates a custom-format backup and restores it into a clean database;
5. validates checksums and logical-decoding output;
6. optionally starts ClickHouse and validates an analytical projection.

The lab is intentionally bounded to 10,000 rows and resource-limited containers.
The scheduled workflow runs the core assertions; analytics remains manually
selectable to keep routine CI cost bounded.

See [Database Migrations And Operations](../../docs/data/database-selection/DATABASE-MIGRATIONS-OPERATIONS.md)
for production reasoning, PITR, failover, upgrade, and retention guidance.
