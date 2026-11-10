-- Nexo Medical: podiatry-focused clinical model and Colombian coding catalogs.
-- Catalogs are versioned; official code lists must be imported from their authoritative releases.
CREATE TABLE IF NOT EXISTS coding_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_code TEXT NOT NULL CHECK (system_code IN ('CIE10','CUPS','CIIU','RIPS')),
  version_label TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_reference TEXT,
  effective_from DATE,
  effective_to DATE,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_current BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(system_code, version_label)
);
CREATE TABLE IF NOT EXISTS coding_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES coding_catalogs(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  display TEXT NOT NULL,
  parent_code TEXT,
  category TEXT,
  billable BOOLEAN,
  active BOOLEAN NOT NULL DEFAULT true,
  valid_from DATE,
  valid_to DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(catalog_id, code)
);
CREATE INDEX IF NOT EXISTS coding_entries_code_idx ON coding_entries(code);
CREATE INDEX IF NOT EXISTS coding_entries_display_idx ON coding_entries USING gin (to_tsvector('spanish', display));

CREATE TABLE IF NOT EXISTS podiatry_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  encounter_id UUID REFERENCES clinical_encounters(id),
  professional_id UUID REFERENCES professionals(id),
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason_for_visit TEXT,
  laterality TEXT CHECK (laterality IN ('right','left','bilateral','not_applicable')),
  skin_findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  nail_findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  interdigital_findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  vascular_findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  neurological_findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  biomechanical_findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  footwear_findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  lesion_or_wound_findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  pain_scale SMALLINT CHECK (pain_scale BETWEEN 0 AND 10),
  risk_level TEXT CHECK (risk_level IN ('low','moderate','high','urgent')),
  clinical_impression TEXT,
  plan_and_recommendations TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','signed','amended')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS podiatry_assessments_patient_idx ON podiatry_assessments(patient_id, assessed_at DESC);

CREATE TABLE IF NOT EXISTS encounter_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  coding_entry_id UUID REFERENCES coding_entries(id),
  coding_system TEXT NOT NULL DEFAULT 'CIE10' CHECK (coding_system IN ('CIE10')),
  code_snapshot TEXT NOT NULL,
  description_snapshot TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  diagnostic_certainty TEXT CHECK (diagnostic_certainty IN ('confirmed','presumptive','rule_out')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS podiatry_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cups_entry_id UUID REFERENCES coding_entries(id),
  duration_minutes INTEGER,
  default_price NUMERIC(14,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS encounter_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES clinical_encounters(id),
  service_id UUID REFERENCES podiatry_services(id),
  cups_entry_id UUID REFERENCES coding_entries(id),
  cups_code_snapshot TEXT,
  description_snapshot TEXT NOT NULL,
  laterality TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_value NUMERIC(14,2),
  total_value NUMERIC(14,2),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS rips_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporting_version TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','locally_validated','submitted','accepted','rejected','adjustment')),
  validation_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  ministry_cuv TEXT,
  submitted_at TIMESTAMPTZ,
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rips_batch_encounters (
  batch_id UUID NOT NULL REFERENCES rips_batches(id) ON DELETE CASCADE,
  encounter_id UUID NOT NULL REFERENCES clinical_encounters(id),
  PRIMARY KEY(batch_id, encounter_id)
);

CREATE TABLE IF NOT EXISTS provider_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  provider_type TEXT,
  nit TEXT,
  dv TEXT,
  retsus_or_professional_id TEXT,
  REPS_provider_code TEXT,
  municipality_code TEXT,
  department_code TEXT,
  economic_activity_code TEXT,
  economic_activity_catalog_id UUID REFERENCES coding_catalogs(id),
  enabled_for_rips BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Preserve the source and version of every catalog. Do not mix CIIU with diagnosis coding.