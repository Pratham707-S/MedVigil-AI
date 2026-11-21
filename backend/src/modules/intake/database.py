import os
import sqlite3
from pathlib import Path

from src.config import get_settings


DEFAULT_DATABASE_PATH = Path(
    os.getenv("MEDVIGIL_DB_PATH", get_settings().sqlite_path)
)


def connect(database_path: str | Path | None = None) -> sqlite3.Connection:
    """Open SQLite and ensure the small intake table exists."""
    path = str(database_path or DEFAULT_DATABASE_PATH)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS intake_records (
            intake_id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            medicines_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.commit()
    return connection
