---
title: Optional Spring Data Modules And Adjacent Tools
description: Spring Data REST, Envers, Neo4j, Couchbase, LDAP and adjacent SQL tools with selection, security, and production guidance.
difficulty: Advanced
page_type: Reference
status: Generic
prerequisites: [Spring Data Architect Path]
learning_objectives: [Recognize optional modules, Select them deliberately, Avoid unsafe repository exposure and abstraction mismatch]
technologies: [Spring Data REST, Envers, Neo4j, Couchbase, LDAP, jOOQ]
last_reviewed: "2026-07-24"
---

# Optional Spring Data Modules And Adjacent Tools

## Spring Data REST

Spring Data REST can expose repositories through hypermedia-driven HTTP resources. It is useful for
controlled CRUD-oriented internal systems and rapid prototypes. Do not expose a domain repository
blindly: repository methods, associations, paging, sorting and mutations become an external security
and compatibility surface.

Before production use, control exported repositories/methods, projections, validation, authorization,
ETags, events, error contracts, page limits and documentation. For business commands and stable public
APIs, explicit controllers/application services usually provide clearer invariant ownership.

## Envers

Spring Data Envers integrates repository access to Hibernate Envers revision history. Use it when
entity-state revisions are required and the storage/retention/query model is acceptable. It does not
replace security audit logs, business events or backups.

## Neo4j

Spring Data Neo4j maps graph nodes and relationships and supports repositories and `Neo4jClient`/
templates. Select it for graph traversal/path problems, not because relationships exist. Model query
directions, relationship cardinality, indexes/constraints, transaction boundaries and cluster routing.

## Couchbase

Spring Data Couchbase supports document/key-value access, repositories, templates, scopes/collections
and reactive APIs. Own durability levels, CAS concurrency, TTL, N1QL indexes, query consistency and
cluster topology. Do not assume its document behavior is identical to MongoDB.

## LDAP

Spring Data LDAP provides repositories and mapping for directory entries. LDAP is hierarchical and
optimized for directory reads/authentication attributes, not general aggregate persistence. DN design,
schema, filters, referrals, TLS and injection-safe query construction are central.

## Adjacent Relational Tools

`JdbcClient`, `JdbcTemplate`, jOOQ and MyBatis are not all Spring Data modules, but may be better for
SQL-first work than a repository abstraction. jOOQ provides generated schema types and a fluent SQL DSL;
MyBatis maps explicit SQL; Spring JDBC provides a small template/client layer. They can coexist with JPA
behind separate adapters when transaction and mapping ownership is clear.

## Selection Questions

- Is the data model relational, document, graph, directory, key/value, wide-column or search?
- Which query patterns dominate and how are they indexed/routed?
- Which consistency and transaction guarantees are required?
- Is repository CRUD the correct abstraction or is an explicit query adapter clearer?
- Can the team operate backup, restore, migration, security and incidents for this engine?
- What evidence would cause the decision to be reversed?

## Official References

- [Spring Data REST](https://docs.spring.io/spring-data/rest/reference/)
- [Spring Data Envers](https://docs.spring.io/spring-data/jpa/reference/envers.html)
- [Spring Data Neo4j](https://docs.spring.io/spring-data/neo4j/reference/)
- [Spring Data Couchbase](https://docs.spring.io/spring-data/couchbase/reference/)
- [Spring Data LDAP](https://docs.spring.io/spring-data/ldap/reference/)

## Recommended Next

Use the decision matrix in the [Spring Data Architect Path](../SPRING-DATA-ARCHITECT-PATH.md).

