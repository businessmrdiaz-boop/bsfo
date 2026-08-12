-- Supabase / Postgres schema for small demo
-- Creates companies, shipments, drivers, transactions, and audit_logs tables

-- Ensure UUID generation function is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Companies (linked to an auth user via user_id)
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL,
  cdl_number text,
  assigned_rig text,
  phone text,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drivers_company_idx ON drivers(company_id);
CREATE INDEX IF NOT EXISTS drivers_user_idx ON drivers(user_id);

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  status text NOT NULL,
  load_id text,
  driver_name text,
  destination text,
  eta text,
  confirmation_code text,
  rig text,
  material_type text,
  tonnage text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shipments_company_idx ON shipments(company_id);
CREATE INDEX IF NOT EXISTS shipments_driver_idx ON shipments(driver_id);
CREATE INDEX IF NOT EXISTS shipments_loadid_idx ON shipments(load_id);

-- Enable RLS and row-level policies
ALTER TABLE IF EXISTS shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "company_can_select_shipments" ON shipments
  FOR SELECT USING (
    company_id = (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "driver_can_select_assigned_shipments" ON shipments
  FOR SELECT USING (
    driver_id = (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "company_can_insert_shipments" ON shipments
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "company_can_update_shipments" ON shipments
  FOR UPDATE USING (
    company_id = (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  ) WITH CHECK (
    company_id = (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "driver_can_update_own_shipments" ON shipments
  FOR UPDATE USING (
    driver_id = (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  ) WITH CHECK (
    driver_id = (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Transactions / Billing
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number text,
  date date,
  customer text,
  amount numeric(12,2) DEFAULT 0,
  status text DEFAULT 'Pending',
  description text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_company_idx ON transactions(company_id);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  event_time timestamptz DEFAULT now(),
  source text,
  action text,
  target text,
  details text,
  status text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_company_idx ON audit_logs(company_id);

-- Example minimal seed (uncomment if you want to insert a demo company)
-- INSERT INTO companies (user_id, name, logo_url) VALUES ('00000000-0000-0000-0000-000000000000','Demo Co','https://example.com/logo.png');
