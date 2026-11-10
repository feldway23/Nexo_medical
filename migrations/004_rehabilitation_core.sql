CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT,
  document_number TEXT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  second_last_name TEXT,
  birth_date DATE,
  sex_at_birth TEXT,
  gender_identity TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','discharged')),
  consent_data_processing BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_type, document_number)
);
CREATE INDEX IF NOT EXISTS patients_name_idx ON patients (last_name, first_name);
CREATE INDEX IF NOT EXISTS patients_status_idx ON patients (status);

CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  license_number TEXT,
  email TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  professional_id UUID REFERENCES professionals(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  appointment_type TEXT NOT NULL DEFAULT 'therapy',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','attended','cancelled','no_show')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_starts_idx ON appointments (starts_at);
CREATE INDEX IF NOT EXISTS appointments_patient_idx ON appointments (patient_id);

CREATE TABLE IF NOT EXISTS clinical_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  professional_id UUID REFERENCES professionals(id),
  appointment_id UUID REFERENCES appointments(id),
  encounter_type TEXT NOT NULL DEFAULT 'initial_assessment',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  chief_complaint TEXT,
  current_illness TEXT,
  relevant_history TEXT,
  occupational_profile TEXT,
  assessment_summary TEXT,
  clinical_status TEXT NOT NULL DEFAULT 'draft' CHECK (clinical_status IN ('draft','signed','amended')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS encounters_patient_idx ON clinical_encounters (patient_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  code_system TEXT NOT NULL DEFAULT 'CIE10',
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intervention_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  encounter_id UUID REFERENCES clinical_encounters(id),
  professional_id UUID REFERENCES professionals(id),
  title TEXT NOT NULL,
  general_objective TEXT,
  approach TEXT,
  frequency_per_week INTEGER,
  planned_sessions INTEGER,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','completed','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS therapy_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES intervention_plans(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  measurement_criteria TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started','in_progress','achieved','modified','discontinued')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES clinical_encounters(id),
  note_type TEXT NOT NULL DEFAULT 'progress',
  subjective TEXT,
  objective TEXT,
  intervention TEXT,
  response TEXT,
  plan_next_session TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','signed','amended')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);