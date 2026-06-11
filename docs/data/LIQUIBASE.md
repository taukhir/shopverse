# Liquibase

Liquibase versions database structure and seed data as ordered change sets. Shopverse runs it during application startup before JPA validates the schema.

## Service Layout

```text
src/main/resources/db/changelog/
  db.changelog-master.yml
  001-...
  002-...
```

The master file includes immutable, ordered change logs. User, Order, Inventory, and Payment each own a separate history.

## Startup Sequence

1. Spring creates the datasource.
2. Liquibase acquires a database lock.
3. It reads `DATABASECHANGELOG`.
4. Unapplied change sets run in order.
5. checksums and execution metadata are stored.
6. the lock is released.
7. Hibernate `ddl-auto=validate` verifies entity/schema compatibility.

`DATABASECHANGELOGLOCK` prevents two replicas from migrating the same schema concurrently.

## Change Set Example

```yaml
databaseChangeLog:
  - changeSet:
      id: 002-add-idempotency-key
      author: shopverse
      changes:
        - addColumn:
            tableName: orders
            columns:
              - column:
                  name: idempotency_key
                  type: varchar(100)
                  constraints:
                    nullable: false
        - addUniqueConstraint:
            tableName: orders
            columnNames: idempotency_key
            constraintName: uk_orders_idempotency_key
```

## Types Of Changes

- schema: tables, columns, indexes, constraints;
- reference data: roles, permissions, catalog seed rows;
- corrective data migration;
- custom SQL only when a structured change type cannot express the operation.

## Consistency

Liquibase identifies a change set by file path, ID, and author. It compares checksums and refuses unexpected edits to already-applied changes. Add a new change set instead of modifying migration history.

## Rollback

Automatic rollback support varies by change type. Production changes should include an explicit rollback when practical:

```yaml
rollback:
  - dropColumn:
      tableName: orders
      columnName: idempotency_key
```

For destructive data changes, prefer forward fixes and database backups. Application transaction rollback does not roll back a migration that has already completed.

## Practices

- one service owns one schema and migration history;
- add indexes for foreign keys and frequent lookup columns;
- use database uniqueness for idempotency;
- keep `open-in-view=false`;
- review locking and table-scan impact before large changes;
- never use `ddl-auto=update` as the production migration strategy.

## Official Reference

- [Liquibase documentation](https://docs.liquibase.com/)
