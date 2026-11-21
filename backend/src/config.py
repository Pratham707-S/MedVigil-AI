"""Centralized runtime configuration for the API process.

The MVP still uses SQLite by default for local development. Production settings
declare both pooled and direct Postgres URLs so application traffic and schema
migrations can be handled with the appropriate Neon connection type.
"""

from dataclasses import dataclass
import os
from pathlib import Path


def _csv(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    environment: str = "development"
    database_url: str | None = None
    database_url_unpooled: str | None = None
    sqlite_path: Path = Path(__file__).resolve().parents[1] / "medvigil.db"
    cors_origins: tuple[str, ...] = ()
    gemini_model: str = "gemini-2.0-flash"
    max_upload_bytes: int = 10 * 1024 * 1024

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            environment=os.getenv("MEDVIGIL_ENV", "development").strip().lower(),
            database_url=os.getenv("DATABASE_URL") or None,
            database_url_unpooled=os.getenv("DATABASE_URL_UNPOOLED") or None,
            sqlite_path=Path(
                os.getenv(
                    "MEDVIGIL_DB_PATH",
                    str(Path(__file__).resolve().parents[1] / "medvigil.db"),
                )
            ),
            cors_origins=_csv(os.getenv("CORS_ORIGINS", "")),
            gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
            max_upload_bytes=int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024))),
        )

    @property
    def is_production(self) -> bool:
        return self.environment in {"production", "staging"}

    def validate_for_production(self) -> None:
        """Reject an unsafe production boot configuration without contacting Neon."""
        if not self.is_production:
            return
        if not self.database_url:
            raise ValueError("DATABASE_URL is required outside local development")
        if not self.database_url_unpooled:
            raise ValueError("DATABASE_URL_UNPOOLED is required for schema migrations")
        if not self.cors_origins:
            raise ValueError("CORS_ORIGINS must explicitly allow the deployed frontend")


def get_settings() -> Settings:
    return Settings.from_env()
