-- Campus Connect Supabase schema + RLS
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- ---------
-- Types
-- ---------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('student', 'faculty', 'club_admin');
  end if;
end$$;

-- ---------
-- Tables
-- ---------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  dob date not null,
  role public.app_role not null default 'student',
  registration_number text not null unique,
  phone text,
  department text,
  year text,
  specialization text,
  skills text[],
  profile_picture_name text,
  bio text,
  linkedin text,
  github text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hackathons (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null,
  date date not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text not null,
  tags text[],
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id bigint not null references public.teams(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (user_id, team_id)
);

create table if not exists public.memberships (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  club_id bigint not null references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, club_id)
);

create table if not exists public.registrations (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id bigint references public.projects(id) on delete cascade,
  hackathon_id bigint references public.hackathons(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint registrations_one_target check (
    (project_id is not null and hackathon_id is null) or
    (project_id is null and hackathon_id is not null)
  )
);

-- ---------
-- Compatibility migrations (for older schema versions)
-- ---------
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists year text;
alter table public.profiles add column if not exists specialization text;
alter table public.profiles add column if not exists skills text[];
alter table public.profiles add column if not exists profile_picture_name text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists linkedin text;
alter table public.profiles add column if not exists github text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.clubs add column if not exists created_at timestamptz not null default now();
alter table public.clubs add column if not exists updated_at timestamptz not null default now();

alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();

alter table public.hackathons add column if not exists created_at timestamptz not null default now();
alter table public.hackathons add column if not exists updated_at timestamptz not null default now();

alter table public.teams add column if not exists tags text[];
alter table public.teams add column if not exists created_at timestamptz not null default now();
alter table public.teams add column if not exists updated_at timestamptz not null default now();

alter table public.team_members add column if not exists joined_at timestamptz not null default now();
alter table public.memberships add column if not exists created_at timestamptz not null default now();
alter table public.registrations add column if not exists created_at timestamptz not null default now();

-- Avoid duplicate registrations for the same item.
create unique index if not exists registrations_project_unique
  on public.registrations(user_id, project_id)
  where project_id is not null;

create unique index if not exists registrations_hackathon_unique
  on public.registrations(user_id, hackathon_id)
  where hackathon_id is not null;

-- Avoid duplicate catalog entries across reruns.
delete from public.projects p
using public.projects p2
where p.id > p2.id
  and lower(p.title) = lower(p2.title);

delete from public.hackathons h
using public.hackathons h2
where h.id > h2.id
  and lower(h.title) = lower(h2.title);

create unique index if not exists projects_title_unique
  on public.projects(lower(title));

create unique index if not exists hackathons_title_unique
  on public.hackathons(lower(title));

-- ---------
-- Helper functions
-- ---------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.get_my_role()
returns public.app_role
language sql
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

-- Admin role comes from auth user metadata:
-- auth.users.raw_app_meta_data = { "role": "admin" }
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---------
-- Triggers
-- ---------
drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_clubs_touch_updated_at on public.clubs;
create trigger trg_clubs_touch_updated_at
before update on public.clubs
for each row execute function public.touch_updated_at();

drop trigger if exists trg_projects_touch_updated_at on public.projects;
create trigger trg_projects_touch_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();

drop trigger if exists trg_hackathons_touch_updated_at on public.hackathons;
create trigger trg_hackathons_touch_updated_at
before update on public.hackathons
for each row execute function public.touch_updated_at();

drop trigger if exists trg_teams_touch_updated_at on public.teams;
create trigger trg_teams_touch_updated_at
before update on public.teams
for each row execute function public.touch_updated_at();

-- ---------
-- RLS
-- ---------
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.projects enable row level security;
alter table public.hackathons enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.memberships enable row level security;
alter table public.registrations enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Public read (authenticated users)
drop policy if exists "clubs_read_authenticated" on public.clubs;
create policy "clubs_read_authenticated"
  on public.clubs for select
  using (auth.uid() is not null);

drop policy if exists "projects_read_authenticated" on public.projects;
create policy "projects_read_authenticated"
  on public.projects for select
  using (auth.uid() is not null);

drop policy if exists "hackathons_read_authenticated" on public.hackathons;
create policy "hackathons_read_authenticated"
  on public.hackathons for select
  using (auth.uid() is not null);

drop policy if exists "teams_read_authenticated" on public.teams;
create policy "teams_read_authenticated"
  on public.teams for select
  using (auth.uid() is not null);

-- Club management: club_admin + admin
drop policy if exists "clubs_insert_by_club_admin_or_admin" on public.clubs;
create policy "clubs_insert_by_club_admin_or_admin"
  on public.clubs for insert
  with check (auth.uid() = created_by and (public.get_my_role() = 'club_admin' or public.is_admin()));

drop policy if exists "clubs_update_by_owner_club_admin_or_admin" on public.clubs;
create policy "clubs_update_by_owner_club_admin_or_admin"
  on public.clubs for update
  using ((auth.uid() = created_by and public.get_my_role() = 'club_admin') or public.is_admin())
  with check ((auth.uid() = created_by and public.get_my_role() = 'club_admin') or public.is_admin());

drop policy if exists "clubs_delete_by_owner_club_admin_or_admin" on public.clubs;
create policy "clubs_delete_by_owner_club_admin_or_admin"
  on public.clubs for delete
  using ((auth.uid() = created_by and public.get_my_role() = 'club_admin') or public.is_admin());

-- Project management: faculty + admin
drop policy if exists "projects_insert_by_faculty_or_admin" on public.projects;
create policy "projects_insert_by_faculty_or_admin"
  on public.projects for insert
  with check (auth.uid() = created_by and (public.get_my_role() = 'faculty' or public.is_admin()));

drop policy if exists "projects_update_by_owner_faculty_or_admin" on public.projects;
create policy "projects_update_by_owner_faculty_or_admin"
  on public.projects for update
  using ((auth.uid() = created_by and public.get_my_role() = 'faculty') or public.is_admin())
  with check ((auth.uid() = created_by and public.get_my_role() = 'faculty') or public.is_admin());

drop policy if exists "projects_delete_by_owner_faculty_or_admin" on public.projects;
create policy "projects_delete_by_owner_faculty_or_admin"
  on public.projects for delete
  using ((auth.uid() = created_by and public.get_my_role() = 'faculty') or public.is_admin());

-- Hackathon management: admin only
drop policy if exists "hackathons_insert_admin_only" on public.hackathons;
create policy "hackathons_insert_admin_only"
  on public.hackathons for insert
  with check (public.is_admin());

drop policy if exists "hackathons_update_admin_only" on public.hackathons;
create policy "hackathons_update_admin_only"
  on public.hackathons for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "hackathons_delete_admin_only" on public.hackathons;
create policy "hackathons_delete_admin_only"
  on public.hackathons for delete
  using (public.is_admin());

drop policy if exists "teams_insert_authenticated" on public.teams;
create policy "teams_insert_authenticated"
  on public.teams for insert
  with check (auth.uid() = created_by and auth.uid() is not null);

drop policy if exists "teams_update_by_owner" on public.teams;
create policy "teams_update_by_owner"
  on public.teams for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "teams_delete_by_owner" on public.teams;
create policy "teams_delete_by_owner"
  on public.teams for delete
  using (auth.uid() = created_by);

drop policy if exists "team_members_select_own" on public.team_members;
create policy "team_members_select_own"
  on public.team_members for select
  using (user_id = auth.uid());

drop policy if exists "team_members_select_authenticated" on public.team_members;
create policy "team_members_select_authenticated"
  on public.team_members for select
  using (auth.uid() is not null);

drop policy if exists "team_members_insert_own" on public.team_members;
create policy "team_members_insert_own"
  on public.team_members for insert
  with check (user_id = auth.uid());

drop policy if exists "team_members_delete_own" on public.team_members;
create policy "team_members_delete_own"
  on public.team_members for delete
  using (user_id = auth.uid());

-- Memberships: user can only manage own rows
drop policy if exists "memberships_select_own" on public.memberships;
create policy "memberships_select_own"
  on public.memberships for select
  using (user_id = auth.uid());

drop policy if exists "memberships_insert_own" on public.memberships;
create policy "memberships_insert_own"
  on public.memberships for insert
  with check (user_id = auth.uid());

drop policy if exists "memberships_delete_own" on public.memberships;
create policy "memberships_delete_own"
  on public.memberships for delete
  using (user_id = auth.uid());

-- Registrations: user can only manage own rows
drop policy if exists "registrations_select_own" on public.registrations;
create policy "registrations_select_own"
  on public.registrations for select
  using (user_id = auth.uid());

drop policy if exists "registrations_insert_own" on public.registrations;
create policy "registrations_insert_own"
  on public.registrations for insert
  with check (user_id = auth.uid());

drop policy if exists "registrations_delete_own" on public.registrations;
create policy "registrations_delete_own"
  on public.registrations for delete
  using (user_id = auth.uid());

-- ---------
-- Optional demo seed data (idempotent)
-- ---------
do $$
declare
  seed_user_id uuid;
begin
  -- Pick one existing auth user for demo ownership.
  select u.id into seed_user_id
  from auth.users u
  order by u.created_at asc
  limit 1;

  if seed_user_id is null then
    raise notice 'No auth.users found. Skipping demo seed data.';
    return;
  end if;

  insert into public.profiles (id, full_name, dob, role, registration_number)
  values (
    seed_user_id,
    'Campus Connect Demo User',
    date '2000-01-01',
    'club_admin',
    'DEMO-' || upper(substr(replace(seed_user_id::text, '-', ''), 1, 8))
  )
  on conflict (id) do nothing;

  if not exists (select 1 from public.profiles where id = seed_user_id) then
    raise notice 'Seed owner profile is missing. Skipping demo seed data.';
    return;
  end if;

  insert into public.clubs (name, description, created_by)
  values
    ('CS Society', 'Weekly coding sessions, peer learning, and community events.', seed_user_id),
    ('AI Research Club', 'ML, NLP, and computer vision workshops and project groups.', seed_user_id),
    ('Design Guild', 'UI/UX design reviews, prototyping, and collaborative design sprints.', seed_user_id)
  on conflict (name) do nothing;

  insert into public.projects (title, description, created_by)
  values
    ('AI Chatbot', 'NLP-powered chatbot for student support and campus guidance.', seed_user_id),
    ('Game Design', 'A 2D game project focused on gameplay systems and teamwork.', seed_user_id),
    ('Data Analytics', 'Interactive dashboards and data storytelling for campus datasets.', seed_user_id)
  on conflict do nothing;

  insert into public.hackathons (title, description, date, created_by)
  values
    ('Campus Innovation Sprint', 'Build practical solutions for real campus challenges.', current_date + interval '14 days', seed_user_id),
    ('AI Builders Challenge', 'Rapid prototyping with AI-first product ideas.', current_date + interval '30 days', seed_user_id),
    ('GreenTech Hack', 'Sustainability-focused technology and impact projects.', current_date + interval '45 days', seed_user_id)
  on conflict do nothing;

  insert into public.teams (name, description, tags, created_by)
  values
    ('Team Alpha', 'Full-stack builders focusing on web apps and APIs.', array['web', 'api'], seed_user_id),
    ('Data Wizards', 'Data science and analytics collaboration team.', array['data', 'ml'], seed_user_id),
    ('UI Crafters', 'Frontend and UX focused implementation team.', array['ui', 'ux'], seed_user_id)
  on conflict (name) do nothing;
end
$$;
