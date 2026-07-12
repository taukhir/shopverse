---
title: Relational Databases
sidebar_position: 1
difficulty: Intermediate
page_type: Comparison
status: Generic
learning_objectives: [Compare relational database engines, Choose a relational database for an OLTP workload]
technologies: [MySQL, PostgreSQL, Oracle Database, Db2, SQL Server, MariaDB, SQLite]
last_reviewed: "2026-07-11"
---

# Relational Databases

Relational databases are the default for structured data with constraints,
joins, and multi-row transactions. They are normally good at both reads and
writes; schema, indexes, contention, durability, and query shape matter more
than generic product rankings.

## Comparison

| Database | Best fit | Read/write and load | Scale posture | Main caution |
|---|---|---|---|---|
| MySQL | conventional web OLTP and commerce | both; excellent indexed reads and strong single-primary writes | scale up and read replicas; shard writes deliberately | secondary indexes include the clustered primary key in InnoDB |
| PostgreSQL | complex OLTP, JSONB, geospatial, advanced SQL | both; strong concurrency and complex reads | scale up, replicas, table partitioning; distributed options add complexity | vacuum health, long transactions, and connection counts |
| Oracle Database | mission-critical enterprise and packaged systems | both at high concurrency | mature partitioning, Data Guard, RAC, enterprise tooling | license/options and specialist operations |
| IBM Db2 | IBM/mainframe and regulated enterprise estates | both; tuned OLTP and analytics | strong vertical/platform-specific clustering | capabilities differ by Db2 platform and edition |
| SQL Server | Microsoft enterprise, .NET, and BI integration | both; strong OLTP and columnstore analytics | scale up, Always On, replicas, partitioning | license/edition and no transparent general write sharding |
| MariaDB | MySQL-family web OLTP | both | replicas and product-specific clustering | do not assume perfect MySQL compatibility |
| SQLite | mobile, desktop, edge, tests, local state | both locally; many readers but serialized writes | independent local files, not server clustering | unsuitable for many remote concurrent writers |

## How The Engines Work

- **MySQL/InnoDB:** clustered primary-key B-tree, secondary indexes referencing
  that key, MVCC, buffer pool, redo/undo logs, and row locks.
- **PostgreSQL:** heap row versions, WAL, MVCC, shared buffers, vacuum, a cost-based
  planner, and B-tree/GIN/GiST/BRIN and other index methods.
- **Oracle Database:** blocks, buffer cache, redo, undo-based consistent reads,
  cost-based optimization, partitioning, PL/SQL, and optional clustering/standbys.
- **Db2:** buffer pools, transaction logs, locking/isolation, compression,
  partitioning, and platform-specific clustering and workload management.
- **SQL Server:** pages/extents, buffer pool, write-ahead log, locking or row
  versioning, B-tree and columnstore indexes, and a cost-based optimizer.
- **MariaDB:** MySQL-family SQL with selectable engines and MariaDB-specific
  optimizer, replication, clustering, and feature behavior.
- **SQLite:** an in-process file engine using B-trees and a rollback journal or WAL.

## Data, Security, And Audit

All handle standard structured values; product-specific support includes JSON,
XML, spatial, full-text, LOB, temporal, array, and extension-defined types. Keep
frequently constrained and joined values in typed columns rather than opaque JSON.

For every product, require encrypted transport, least-privilege roles, network
isolation, encryption and key management, encrypted/tested backups, protected
audit retention, and separation of privileged administration. Audit feature
availability often depends on edition, platform, plugin, or managed-service tier.
Database statement logs complement—but do not replace—business audit events with
actor, action, target, time, correlation ID, and safe before/after metadata.

## Choosing Among Them

- Choose **MySQL/MariaDB** for straightforward web OLTP and a broad ecosystem.
- Choose **PostgreSQL** for relational correctness plus advanced SQL, types, JSONB,
  extensions, or geospatial work.
- Choose **Oracle, Db2, or SQL Server** when enterprise platform, packaged software,
  governance, support, or existing skills justify them.
- Choose **SQLite** when storage belongs inside one application/device.

Do not choose from feature lists alone. Benchmark transaction contention,
replication lag, restore time, index maintenance, and the actual critical queries.
