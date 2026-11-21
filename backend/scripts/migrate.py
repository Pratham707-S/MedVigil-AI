"""Apply checked-in SQL migrations using a direct Postgres connection."""

from __future__ import annotations

import os
from pathlib import Path

import psycopg


MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "migrations"


def migration_files() -> list[Path]:
    return sorted(MIGRATIONS_DIR.glob("*.sql"))


def main() -> None:
    database_url = os.getenv("DATABASE_URL_UNPOOLED") or os.getenv("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL_UNPOOLED or DATABASE_URL is required")
    if "-pooler." in database_url:
        raise SystemExit("Use DATABASE_URL_UNPOOLED with a direct Neon hostname for migrations")

    with psycopg.connect(database_url) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        applied = {
            row[0] for row in connection.execute("SELECT version FROM schema_migrations")
        }
        for migration in migration_files():
            if migration.name in applied:
                continue
            connection.execute(migration.read_text(encoding="utf-8"))
            connection.execute(
                "INSERT INTO schema_migrations (version) VALUES (%s)",
                (migration.name,),
            )
            print(f"applied {migration.name}")


if __name__ == "__main__":
    main()
