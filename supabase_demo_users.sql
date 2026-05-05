-- ============================================================
-- DEMO USERS - Run in Supabase SQL Editor
-- Creates 3 demo accounts with profiles
-- ============================================================

-- 1. Club Admin account
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'aaaa1111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'admin@campus.demo',
  crypt('Admin@1234', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}', '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'aaaa1111-1111-1111-1111-111111111111',
  'admin@campus.demo',
  jsonb_build_object('sub', 'aaaa1111-1111-1111-1111-111111111111', 'email', 'admin@campus.demo'),
  'email', now(), now(), now()
)
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, full_name, dob, role, registration_number, department, year, skills, bio, phone)
VALUES (
  'aaaa1111-1111-1111-1111-111111111111',
  'Arjun Mehta',
  '2004-03-15',
  'club_admin',
  'CA2024001',
  'Computer Science',
  '3rd Year',
  ARRAY['React','Node.js','Python','Leadership'],
  'Club admin and full-stack developer. Passionate about building campus tech.',
  '9876543210'
)
ON CONFLICT (id) DO UPDATE SET role = 'club_admin', full_name = 'Arjun Mehta';

-- 2. Student account
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'bbbb2222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated',
  'student@campus.demo',
  crypt('Student@1234', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}', '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bbbb2222-2222-2222-2222-222222222222',
  'student@campus.demo',
  jsonb_build_object('sub', 'bbbb2222-2222-2222-2222-222222222222', 'email', 'student@campus.demo'),
  'email', now(), now(), now()
)
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, full_name, dob, role, registration_number, department, year, skills, bio, phone)
VALUES (
  'bbbb2222-2222-2222-2222-222222222222',
  'Priya Sharma',
  '2005-07-22',
  'student',
  'ST2024042',
  'Information Technology',
  '2nd Year',
  ARRAY['Flutter','Dart','Firebase','UI/UX'],
  'Mobile dev enthusiast. Love building beautiful apps.',
  '9123456780'
)
ON CONFLICT (id) DO UPDATE SET role = 'student', full_name = 'Priya Sharma';

-- 3. Faculty account
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'cccc3333-3333-3333-3333-333333333333',
  'authenticated', 'authenticated',
  'faculty@campus.demo',
  crypt('Faculty@1234', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}', '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'cccc3333-3333-3333-3333-333333333333',
  'faculty@campus.demo',
  jsonb_build_object('sub', 'cccc3333-3333-3333-3333-333333333333', 'email', 'faculty@campus.demo'),
  'email', now(), now(), now()
)
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, full_name, dob, role, registration_number, department, year, skills, bio, phone)
VALUES (
  'cccc3333-3333-3333-3333-333333333333',
  'Dr. Ravi Kumar',
  '1985-11-08',
  'faculty',
  'FAC2020010',
  'Computer Science',
  'Faculty',
  ARRAY['Machine Learning','Data Science','Research','Mentoring'],
  'Associate Professor, CS department. Hackathon mentor and advisor.',
  '9988776655'
)
ON CONFLICT (id) DO UPDATE SET role = 'faculty', full_name = 'Dr. Ravi Kumar';

-- 4. Seed some registrations for demo data
INSERT INTO registrations (user_id, hackathon_id)
SELECT 'bbbb2222-2222-2222-2222-222222222222', id FROM hackathons WHERE title = 'WebDev Blitz 2026'
ON CONFLICT DO NOTHING;

INSERT INTO registrations (user_id, hackathon_id)
SELECT 'bbbb2222-2222-2222-2222-222222222222', id FROM hackathons WHERE title = 'Mobile App Sprint'
ON CONFLICT DO NOTHING;

INSERT INTO registrations (user_id, hackathon_id)
SELECT 'cccc3333-3333-3333-3333-333333333333', id FROM hackathons WHERE title = 'AI/ML Innovation Challenge'
ON CONFLICT DO NOTHING;

-- Done! Demo users created.
