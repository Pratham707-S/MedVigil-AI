-- MedVigil production foundation schema for Neon/Postgres.
-- Runtime application traffic should use DATABASE_URL (pooled); migrations
-- should use DATABASE_URL_UNPOOLED (direct).

CREATE TABLE IF NOT EXISTS intake_records (
    intake_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    medicines_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_records_patient_created
    ON intake_records (patient_id, created_at, intake_id);

CREATE TABLE IF NOT EXISTS prescription_drafts (
    prescription_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    source_filename TEXT NOT NULL,
    prescribed_on DATE,
    medicines_json JSONB NOT NULL,
    needs_review BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prescription_drafts_patient_created
    ON prescription_drafts (patient_id, created_at, prescription_id);

CREATE TABLE IF NOT EXISTS confirmed_prescriptions (
    prescription_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    prescribed_on DATE NOT NULL,
    source_filename TEXT NOT NULL DEFAULT '',
    medicines_json JSONB NOT NULL,
    stop_instructions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_confirmed_prescriptions_patient_date
    ON confirmed_prescriptions (patient_id, prescribed_on, prescription_id);

CREATE TABLE IF NOT EXISTS prescription_audit_events (
    event_id TEXT PRIMARY KEY,
    prescription_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('uploaded', 'edited', 'confirmed')),
    actor_id TEXT,
    reviewed_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescription_audit_patient_created
    ON prescription_audit_events (patient_id, created_at, event_id);
