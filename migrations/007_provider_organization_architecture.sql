-- Nexo Medical: provider lifecycle and multi-site foundation.
CREATE TABLE IF NOT EXISTS provider_organizations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 legal_name TEXT NOT NULL,
 trade_name TEXT,
 provider_kind TEXT NOT NULL DEFAULT 'independent' CHECK (provider_kind IN ('independent','ips','other')),
 legal_type TEXT NOT NULL DEFAULT 'natural_person' CHECK (legal_type IN ('natural_person','legal_entity')),
 document_type TEXT,
 document_number TEXT,
 dv TEXT,
 email TEXT,
 phone TEXT,
 department_code TEXT,
 municipality_code TEXT,
 address TEXT,
 reps_code TEXT,
 status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup','active','transitioning','inactive')),
 effective_from DATE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS provider_sites (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES provider_organizations(id),
 name TEXT NOT NULL,
 site_code TEXT,
 address TEXT,
 department_code TEXT,
 municipality_code TEXT,
 phone TEXT,
 modality TEXT NOT NULL DEFAULT 'intramural',
 status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','closed')),
 reps_site_code TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS organization_professionals (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES provider_organizations(id),
 professional_id UUID NOT NULL REFERENCES professionals(id),
 role TEXT NOT NULL DEFAULT 'professional',
 registration_type TEXT,
 registration_number TEXT,
 credential_verified BOOLEAN NOT NULL DEFAULT false,
 starts_on DATE,
 ends_on DATE,
 status TEXT NOT NULL DEFAULT 'active',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(organization_id, professional_id)
);
CREATE TABLE IF NOT EXISTS provider_site_services (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id UUID NOT NULL REFERENCES provider_organizations(id),
 site_id UUID NOT NULL REFERENCES provider_sites(id),
 service_name TEXT NOT NULL,
 internal_code TEXT,
 cups_entry_id UUID REFERENCES coding_entries(id),
 service_group TEXT,
 complexity TEXT,
 modality TEXT,
 installed_capacity INTEGER,
 habilitation_status TEXT NOT NULL DEFAULT 'planning' CHECK (habilitation_status IN ('planning','self_assessment','declared_reps','verified','suspended','closed')),
 reps_service_code TEXT,
 verified_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS clinical_record_custody_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 patient_id UUID NOT NULL REFERENCES patients(id),
 history_id UUID REFERENCES podiatry_clinical_histories(id),
 from_organization_id UUID REFERENCES provider_organizations(id),
 to_organization_id UUID REFERENCES provider_organizations(id),
 event_type TEXT NOT NULL CHECK (event_type IN ('created','custody_transfer','exported_copy','legal_hold','retention_review')),
 reason TEXT,
 authorized_by TEXT,
 occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS provider_sites_org_idx ON provider_sites(organization_id);
CREATE INDEX IF NOT EXISTS org_professional_org_idx ON organization_professionals(organization_id);
CREATE INDEX IF NOT EXISTS provider_services_site_idx ON provider_site_services(site_id);
CREATE INDEX IF NOT EXISTS custody_patient_idx ON clinical_record_custody_events(patient_id, occurred_at DESC);
ALTER TABLE provider_profile ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES provider_organizations(id);
ALTER TABLE podiatry_clinical_histories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES provider_organizations(id);
ALTER TABLE podiatry_clinical_histories ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES provider_sites(id);
ALTER TABLE podiatry_clinical_histories ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES provider_site_services(id);
ALTER TABLE clinical_encounters ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES provider_organizations(id);
ALTER TABLE clinical_encounters ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES provider_sites(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES provider_organizations(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES provider_sites(id);