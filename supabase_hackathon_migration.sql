-- ============================================================
-- HACKATHON MANAGEMENT SYSTEM - Supabase Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Add new columns to hackathons table (safe: IF NOT EXISTS style)
DO $$
BEGIN
  -- Add prize column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='prize') THEN
    ALTER TABLE hackathons ADD COLUMN prize text DEFAULT '';
  END IF;
  -- Add max_participants
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='max_participants') THEN
    ALTER TABLE hackathons ADD COLUMN max_participants integer DEFAULT 100;
  END IF;
  -- Add status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='status') THEN
    ALTER TABLE hackathons ADD COLUMN status text DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','completed','cancelled'));
  END IF;
  -- Add tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='tags') THEN
    ALTER TABLE hackathons ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  -- Add created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='created_by') THEN
    ALTER TABLE hackathons ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
  -- Add club_id (optional link to a club)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='club_id') THEN
    ALTER TABLE hackathons ADD COLUMN club_id bigint REFERENCES clubs(id) ON DELETE SET NULL;
  END IF;
  -- Add location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='location') THEN
    ALTER TABLE hackathons ADD COLUMN location text DEFAULT 'Online';
  END IF;
  -- Add end_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='end_date') THEN
    ALTER TABLE hackathons ADD COLUMN end_date text DEFAULT '';
  END IF;
  -- Add created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='created_at') THEN
    ALTER TABLE hackathons ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  -- Add image_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hackathons' AND column_name='image_url') THEN
    ALTER TABLE hackathons ADD COLUMN image_url text DEFAULT '';
  END IF;
END $$;

-- 2. Ensure registrations table has registered_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='registrations' AND column_name='registered_at') THEN
    ALTER TABLE registrations ADD COLUMN registered_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 3. Enable RLS (idempotent)
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 4. Drop & recreate policies (idempotent)
DROP POLICY IF EXISTS "Anyone can read hackathons" ON hackathons;
CREATE POLICY "Anyone can read hackathons" ON hackathons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert hackathons" ON hackathons;
CREATE POLICY "Authenticated users can insert hackathons" ON hackathons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Creators can update hackathons" ON hackathons;
CREATE POLICY "Creators can update hackathons" ON hackathons FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creators can delete hackathons" ON hackathons;
CREATE POLICY "Creators can delete hackathons" ON hackathons FOR DELETE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Anyone can read registrations" ON registrations;
CREATE POLICY "Anyone can read registrations" ON registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert registrations" ON registrations;
CREATE POLICY "Users can insert registrations" ON registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own registrations" ON registrations;
CREATE POLICY "Users can delete own registrations" ON registrations FOR DELETE USING (auth.uid() = user_id);

-- 5. Seed demo hackathons (only if table is empty)
INSERT INTO hackathons (title, description, date, end_date, prize, max_participants, status, tags, location, image_url)
SELECT title, description, date::date, end_date, prize, max_participants, status, tags, location, image_url
FROM (VALUES
  (
    'WebDev Blitz 2026',
    'Build a full-stack web application in 48 hours. Themes include fintech, edtech, and sustainability. Mentors from Google, Microsoft, and Amazon will be available throughout.',
    '2026-05-20',
    '2026-05-22',
    '₹50,000 + Internship Offers',
    80,
    'active',
    ARRAY['React','Node.js','Full-Stack','Web'],
    'Main Auditorium, Block A',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80'
  ),
  (
    'AI/ML Innovation Challenge',
    'Design and deploy a machine learning model that solves a real-world problem. Datasets provided. Judged on accuracy, creativity, and presentation. Bring your GPU!',
    '2026-06-01',
    '2026-06-03',
    '₹75,000 + Cloud Credits',
    60,
    'upcoming',
    ARRAY['Python','TensorFlow','AI','ML','Data Science'],
    'Innovation Lab, Block C',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80'
  ),
  (
    'Mobile App Sprint',
    'Create a cross-platform mobile app that improves campus life. Flutter or React Native. Best UI/UX wins a bonus prize. Demo on real devices required.',
    '2026-05-10',
    '2026-05-12',
    '₹30,000 + App Store Credits',
    50,
    'active',
    ARRAY['Flutter','React Native','Mobile','UI/UX'],
    'CS Lab 204',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80'
  ),
  (
    'Cybersecurity CTF',
    'Capture The Flag competition with challenges across cryptography, reverse engineering, forensics, and web exploitation. Solo or team of 3.',
    '2026-06-15',
    '2026-06-16',
    '₹40,000 + Security Certifications',
    100,
    'upcoming',
    ARRAY['Security','CTF','Networking','Linux'],
    'Online (Discord)',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80'
  ),
  (
    'Blockchain DeFi Hackathon',
    'Build decentralized finance applications on Ethereum or Solana. Smart contracts, DApps, and tokenomics. Sponsored by leading Web3 companies.',
    '2026-04-15',
    '2026-04-17',
    '₹1,00,000 + Token Grants',
    40,
    'completed',
    ARRAY['Blockchain','Solidity','Web3','DeFi'],
    'Tech Park, Floor 3',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=80'
  ),
  (
    'Open Source Contribution Week',
    'Contribute to major open source projects. Mentored sessions with maintainers from popular repos. Top contributors get swag and recognition.',
    '2026-07-01',
    '2026-07-07',
    '₹20,000 + GitHub Swag',
    200,
    'upcoming',
    ARRAY['Open Source','Git','GitHub','Community'],
    'Online + Campus Hub',
    'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=600&q=80'
  )
) AS v(title, description, date, end_date, prize, max_participants, status, tags, location, image_url)
WHERE NOT EXISTS (SELECT 1 FROM hackathons LIMIT 1);

-- Done! Your hackathon system is ready.
