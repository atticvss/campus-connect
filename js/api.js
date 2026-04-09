import { supabase } from './supabaseClient.js';

function isSchemaMissingMessage(message) {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('could not find the table') ||
    text.includes('schema cache') ||
    text.includes('relation') && text.includes('does not exist')
  );
}

function normalizeSupabaseError(error, fallbackMessage) {
  const message = String(error?.message || '');
  const messageLower = message.toLowerCase();
  if (isSchemaMissingMessage(message)) {
    return new Error(
      'Supabase database schema is missing. Run supabase/schema.sql in Supabase SQL Editor, wait 10-20 seconds, then refresh and try again.'
    );
  }
  if (messageLower.includes('duplicate key value') || messageLower.includes('already exists')) {
    if (messageLower.includes('registration_number')) {
      return new Error('This registration number is already in use. Please use a different one.');
    }
    if (messageLower.includes('profiles') && messageLower.includes('duplicate')) {
      return new Error('Profile already exists for this account.');
    }
    if (messageLower.includes('teams_name') || messageLower.includes('teams') && messageLower.includes('name')) {
      return new Error('A team with this name already exists. Please choose a different name.');
    }
    return new Error('This entry already exists. Duplicate records are not allowed.');
  }
  return new Error(message || fallbackMessage || 'Supabase request failed');
}

function throwOnError(error, fallbackMessage) {
  if (error) {
    throw normalizeSupabaseError(error, fallbackMessage);
  }
}

function mapSupabaseNetworkError(error, fallbackMessage) {
  const message = String(error?.message || '');
  if (isSchemaMissingMessage(message)) {
    return new Error(
      'Supabase database schema is missing. Run supabase/schema.sql in Supabase SQL Editor, wait 10-20 seconds, then refresh and try again.'
    );
  }
  if (message.toLowerCase().includes('failed to fetch') || error?.name === 'TypeError') {
    return new Error(
      'Unable to reach Supabase. Check js/config.js values, internet connection, and whether your Supabase project is active.'
    );
  }
  return new Error(message || fallbackMessage || 'Supabase request failed');
}

export async function signUpWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    throwOnError(error, 'Signup failed');
    return data;
  } catch (error) {
    throw mapSupabaseNetworkError(error, 'Signup failed');
  }
}

export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    throwOnError(error, 'Login failed');
    return data;
  } catch (error) {
    throw mapSupabaseNetworkError(error, 'Login failed');
  }
}

export async function signOutCurrentUser() {
  const { error } = await supabase.auth.signOut();
  throwOnError(error, 'Logout failed');
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  throwOnError(error, 'Could not load auth session');
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  throwOnError(error, 'Could not load current user');
  return data.user;
}

export async function upsertProfile(profile) {
  const payload = {
    id: profile.id,
    full_name: profile.full_name,
    dob: profile.dob,
    role: profile.role,
    registration_number: profile.registration_number,
    phone: profile.phone || null,
    department: profile.department || null,
    year: profile.year || null,
    specialization: profile.specialization || null,
    skills: Array.isArray(profile.skills) ? profile.skills : null,
    profile_picture_name: profile.profile_picture_name || null,
    bio: profile.bio || null,
    linkedin: profile.linkedin || null,
    github: profile.github || null
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  throwOnError(error, 'Could not save profile');
  return data;
}

export async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  throwOnError(error, 'Could not load profile');
  return data;
}

export async function createTeam(payload) {
  const { data, error } = await supabase
    .from('teams')
    .insert(payload)
    .select()
    .single();

  throwOnError(error, 'Could not create team');
  return data;
}

export async function listTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_members(id, user_id, joined_at)')
    .order('created_at', { ascending: false });

  throwOnError(error, 'Could not load teams');
  return data || [];
}

export async function listMyTeams(userId) {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, team_id, teams(*)')
    .eq('user_id', userId)
    .order('id', { ascending: false });

  throwOnError(error, 'Could not load joined teams');
  return data || [];
}

export async function joinTeam(userId, teamId) {
  const { error } = await supabase
    .from('team_members')
    .upsert({ user_id: userId, team_id: teamId }, { onConflict: 'user_id,team_id' });

  throwOnError(error, 'Could not join team');
}

export async function leaveTeam(userId, teamId) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('user_id', userId)
    .eq('team_id', teamId);

  throwOnError(error, 'Could not leave team');
}

export async function listTeamMembers(teamId) {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, user_id, joined_at, profiles(id, full_name, role, registration_number)')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  throwOnError(error, 'Could not load team members');
  return data || [];
}

export async function listClubs() {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .order('created_at', { ascending: false });

  throwOnError(error, 'Could not load clubs');
  return data || [];
}

export async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  throwOnError(error, 'Could not load projects');
  return data || [];
}

export async function listHackathons() {
  const { data, error } = await supabase
    .from('hackathons')
    .select('*')
    .order('date', { ascending: true });

  throwOnError(error, 'Could not load hackathons');
  return data || [];
}

export async function listMyMemberships(userId) {
  const { data, error } = await supabase
    .from('memberships')
    .select('id, club_id, clubs(*)')
    .eq('user_id', userId);

  throwOnError(error, 'Could not load memberships');
  return data || [];
}

export async function listMyRegistrations(userId) {
  const { data, error } = await supabase
    .from('registrations')
    .select('id, project_id, hackathon_id, projects(*), hackathons(*)')
    .eq('user_id', userId);

  throwOnError(error, 'Could not load registrations');
  return data || [];
}

export async function joinClub(userId, clubId) {
  const { error } = await supabase
    .from('memberships')
    .upsert({ user_id: userId, club_id: clubId }, { onConflict: 'user_id,club_id' });

  throwOnError(error, 'Could not join club');
}

export async function leaveClub(userId, clubId) {
  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('user_id', userId)
    .eq('club_id', clubId);

  throwOnError(error, 'Could not leave club');
}

export async function registerProject(userId, projectId) {
  const { error } = await supabase
    .from('registrations')
    .upsert({ user_id: userId, project_id: projectId, hackathon_id: null }, { onConflict: 'user_id,project_id' });

  throwOnError(error, 'Could not register project');
}

export async function unregisterProject(userId, projectId) {
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId);

  throwOnError(error, 'Could not unregister project');
}

export async function registerHackathon(userId, hackathonId) {
  const { error } = await supabase
    .from('registrations')
    .upsert({ user_id: userId, project_id: null, hackathon_id: hackathonId }, { onConflict: 'user_id,hackathon_id' });

  throwOnError(error, 'Could not register hackathon');
}

export async function unregisterHackathon(userId, hackathonId) {
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('user_id', userId)
    .eq('hackathon_id', hackathonId);

  throwOnError(error, 'Could not unregister hackathon');
}

export async function createClub(payload) {
  const { data, error } = await supabase
    .from('clubs')
    .insert(payload)
    .select()
    .single();

  throwOnError(error, 'Could not create club');
  return data;
}

export async function updateClub(id, payload) {
  const { data, error } = await supabase
    .from('clubs')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  throwOnError(error, 'Could not update club');
  return data;
}

export async function deleteClub(id) {
  const { error } = await supabase
    .from('clubs')
    .delete()
    .eq('id', id);

  throwOnError(error, 'Could not delete club');
}

export async function createProject(payload) {
  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select()
    .single();

  throwOnError(error, 'Could not create project');
  return data;
}

export async function updateProject(id, payload) {
  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  throwOnError(error, 'Could not update project');
  return data;
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  throwOnError(error, 'Could not delete project');
}

export async function createHackathon(payload) {
  const { data, error } = await supabase
    .from('hackathons')
    .insert(payload)
    .select()
    .single();

  throwOnError(error, 'Could not create hackathon');
  return data;
}

export async function updateHackathon(id, payload) {
  const { data, error } = await supabase
    .from('hackathons')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  throwOnError(error, 'Could not update hackathon');
  return data;
}

export async function deleteHackathon(id) {
  const { error } = await supabase
    .from('hackathons')
    .delete()
    .eq('id', id);

  throwOnError(error, 'Could not delete hackathon');
}

export async function fetchDashboard(userId) {
  const [{ data: memberships, error: membershipsError }, { data: registrations, error: registrationsError }] = await Promise.all([
    supabase
      .from('memberships')
      .select('club_id, clubs(id, name)')
      .eq('user_id', userId),
    supabase
      .from('registrations')
      .select('project_id, hackathon_id, projects(id, title), hackathons(id, title, date)')
      .eq('user_id', userId)
  ]);

  throwOnError(membershipsError, 'Could not load joined clubs');
  throwOnError(registrationsError, 'Could not load registrations');

  return {
    joinedClubs: memberships || [],
    registrations: registrations || []
  };
}
