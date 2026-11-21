import unittest
from pathlib import Path


class MigrationContractTests(unittest.TestCase):
    def test_initial_schema_contains_patient_scoped_production_tables(self):
        migration = (Path(__file__).resolve().parents[1] / "migrations" / "0001_initial.sql").read_text()

        for table in (
            "intake_records",
            "prescription_drafts",
            "confirmed_prescriptions",
            "prescription_audit_events",
        ):
            self.assertIn(f"CREATE TABLE IF NOT EXISTS {table}", migration)
        self.assertIn("idx_confirmed_prescriptions_patient_date", migration)
        self.assertIn("patient_id TEXT NOT NULL", migration)
        self.assertIn("action IN ('uploaded', 'edited', 'confirmed')", migration)

    def test_migration_runner_uses_direct_url_and_tracks_versions(self):
        runner = (Path(__file__).resolve().parents[1] / "scripts" / "migrate.py").read_text()

        self.assertIn("DATABASE_URL_UNPOOLED", runner)
        self.assertIn("-pooler.", runner)
        self.assertIn("schema_migrations", runner)


if __name__ == "__main__":
    unittest.main()
