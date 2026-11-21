# Postgres migrations

This directory is the source of truth for the production schema. The migration
runner applies files in lexical order and records applied versions in
`schema_migrations`.

Use a direct, non-pooled Neon connection for migrations:

```bash
DATABASE_URL_UNPOOLED='postgresql://...' python backend/scripts/migrate.py
```

Application traffic should use the pooled `DATABASE_URL`. The runner refuses a
pooled URL when it can detect the `-pooler` hostname suffix. No migration is
run automatically during API startup.

The local MVP continues to use SQLite until the repositories are moved behind a
Postgres implementation in the next production phase. The Postgres schema is
already patient-scoped, indexed for timeline reads, and includes draft,
confirmation, and audit-event storage needed for the production cutover.
