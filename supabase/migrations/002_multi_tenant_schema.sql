-- AutoShopATS Multi-Tenant Schema
-- Adds shops, updates users/applicants for multi-tenancy

-- =====================
-- SHOPS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_shops_slug ON shops(slug);

-- Trigger for updated_at
CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- UPDATE PROFILES TABLE
-- =====================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
CREATE INDEX IF NOT EXISTS idx_profiles_shop ON profiles(shop_id);

-- =====================
-- DROP OLD APPLICANTS AND RECREATE
-- =====================
DROP TABLE IF EXISTS applicant_notes CASCADE;
DROP TABLE IF EXISTS applicants CASCADE;

-- =====================
-- NEW APPLICANTS TABLE
-- =====================
CREATE TABLE applicants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  shop_id UUID REFERENCES shops(id) NOT NULL,
  
  -- Core fields (indexed for filtering)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position_applied TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW',
  source TEXT,
  
  -- All form data as JSONB
  form_data JSONB DEFAULT '{}'::jsonb,
  
  -- Internal admin-only data
  internal_data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_applicants_shop ON applicants(shop_id);
CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_applicants_position ON applicants(position_applied);
CREATE INDEX idx_applicants_created ON applicants(created_at DESC);

CREATE TRIGGER applicants_updated_at
  BEFORE UPDATE ON applicants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- APPLICANT NOTES TABLE
-- =====================
CREATE TABLE applicant_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  added_by TEXT,
  added_by_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL
);

CREATE INDEX idx_notes_applicant ON applicant_notes(applicant_id);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_notes ENABLE ROW LEVEL SECURITY;

-- Shops: users can only see their own shop
CREATE POLICY "Users can view own shop" ON shops
  FOR SELECT USING (
    id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own shop" ON shops
  FOR UPDATE USING (
    id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

-- Applicants: public insert (with shop_id), shop users can read/update/delete
CREATE POLICY "Anyone can submit application" ON applicants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Shop users can view applicants" ON applicants
  FOR SELECT USING (
    shop_id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Shop users can update applicants" ON applicants
  FOR UPDATE USING (
    shop_id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Shop users can delete applicants" ON applicants
  FOR DELETE USING (
    shop_id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

-- Notes: shop users only
CREATE POLICY "Shop users can manage notes" ON applicant_notes
  FOR ALL USING (
    applicant_id IN (
      SELECT a.id FROM applicants a 
      JOIN profiles p ON a.shop_id = p.shop_id 
      WHERE p.id = auth.uid()
    )
  );

-- Update profiles policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow inserting profile with shop_id during signup
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
