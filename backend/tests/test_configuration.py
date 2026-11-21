import unittest
from pathlib import Path

from src.config import Settings


class ConfigurationTests(unittest.TestCase):
    def test_local_defaults_keep_sqlite_and_do_not_require_credentials(self):
        settings = Settings()

        self.assertEqual(settings.environment, "development")
        self.assertIsNone(settings.database_url)
        self.assertEqual(settings.sqlite_path, Path(__file__).resolve().parents[1] / "medvigil.db")
        settings.validate_for_production()

    def test_production_requires_database_and_explicit_cors(self):
        settings = Settings(environment="production", database_url="postgresql://runtime")

        with self.assertRaisesRegex(ValueError, "DATABASE_URL_UNPOOLED"):
            settings.validate_for_production()

    def test_production_accepts_pooled_runtime_and_direct_migration_urls(self):
        settings = Settings(
            environment="production",
            database_url="postgresql://runtime",
            database_url_unpooled="postgresql://direct",
            cors_origins=("https://app.example",),
        )

        settings.validate_for_production()


if __name__ == "__main__":
    unittest.main()
