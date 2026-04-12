import {
  signUpWithEmail,
  signInWithEmail,
  signOutCurrentUser,
  getSession,
  getCurrentUser,
  upsertProfile,
  getMyProfile,
  listClubs,
  listProjects,
  listHackathons,
  listTeams,
  listMyTeams,
  listMyMemberships,
  listMyRegistrations,
  createTeam as createTeamRecord,
  joinTeam as joinTeamRecord,
  leaveTeam as leaveTeamRecord,
  joinClub,
  leaveClub,
  registerProject,
  unregisterProject,
  registerHackathon,
  unregisterHackathon,
  createClub,
  updateClub,
  deleteClub,
  createProject,
  updateProject,
  deleteProject,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  fetchDashboard
} from './api.js';
import { hasSupabaseConfig, supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient.js';

const state = {
  session: null,
  user: null,
  profile: null,
  clubs: [],
  projects: [],
  hackathons: [],
  teams: [],
  myTeams: [],
  memberships: [],
  registrations: []
};

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message) {
  if (typeof window.showToast === 'function') {
    window.showToast(message);
    return;
  }
  window.alert(message);
}

function setError(message) {
  const errorEl = document.getElementById('login-error');
  if (!errorEl) return;
  errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${escapeHtml(message)}`;
  errorEl.style.display = 'flex';
  errorEl.style.alignItems = 'center';
}

function clearError() {
  const errorEl = document.getElementById('login-error');
  if (!errorEl) return;
  errorEl.style.display = 'none';
}

function setLoading(buttonId, loading, label) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
  button.disabled = loading;
  button.classList.toggle('loading', loading);
  button.textContent = loading ? label : button.dataset.defaultText;
}

function setFieldContainerState(inputId, isValid) {
  const input = document.getElementById(inputId);
  const container = input?.closest('.field') || input?.closest('.field-light');
  if (!container) return;
  container.classList.remove('valid', 'invalid');
  if (isValid === true) container.classList.add('valid');
  if (isValid === false) container.classList.add('invalid');
}

function setInlineErrorText(errorId, message) {
  const el = document.getElementById(errorId);
  if (!el) return;
  el.textContent = message || '';
  el.style.display = message ? 'block' : 'none';
}

function setSignupBanner(message) {
  const banner = document.getElementById('signup-verify-banner');
  if (!banner) return;
  banner.textContent = message || '';
  banner.classList.toggle('show', !!message);
}

function setSchemaSetupGuidance(message) {
  const finalMessage = message || '';
  setError(finalMessage);
  if (finalMessage) {
    showToast('Run supabase/schema.sql in Supabase SQL Editor, then refresh.');
  }
}

function prepareDynamicContainers() {
  const placeholders = {
    'clubs-grid': '<div class="dash-card"><h3>Loading clubs...</h3><p>Please wait.</p></div>',
    'projects-grid': '<div class="dash-card"><h3>Loading projects...</h3><p>Please wait.</p></div>',
    'hack-grid': '<div class="club-list-item"><h4><i class="fas fa-spinner"></i> Loading hackathons...</h4></div>',
    'team-list': '<div class="club-list-item"><h4><i class="fas fa-spinner"></i> Loading teams...</h4></div>'
  };

  Object.entries(placeholders).forEach(([id, html]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function isSchemaMissingError(error) {
  const text = String(error?.message || '').toLowerCase();
  return (
    text.includes('could not find the table') ||
    text.includes('schema cache') ||
    (text.includes('relation') && text.includes('does not exist')) ||
    text.includes('database schema is missing')
  );
}

function isAdminUser() {
  return state.user?.app_metadata?.role === 'admin';
}

function hasPortalAccess() {
  if (!state.profile) return false;
  return state.profile.role === 'club_admin' || state.profile.role === 'faculty' || isAdminUser();
}

function applyProfileToLegacyUI() {
  if (!state.profile || !state.user) return;
  const fullName = state.profile.full_name || state.user.email;
  const initials = fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const mappedUser = {
    username: state.user.email,
    name: fullName,
    initials,
    email: state.user.email,
    role: state.profile.role === 'club_admin' ? 'clubAdmin' : state.profile.role,
    profileRole: state.profile.role === 'club_admin' ? 'Club Admin' : state.profile.role === 'faculty' ? 'Faculty' : 'Student',
    idNumber: state.profile.registration_number,
    phone: state.profile.phone || '',
    department: state.profile.department || '',
    program: state.profile.specialization || state.profile.department || '',
    yearOrExperience: state.profile.year || '',
    cgpa: state.profile.cgpa || '',
    linkedIn: state.profile.linkedin || '',
    githubOrPortfolio: state.profile.github || '',
    bio: state.profile.bio || '',
    skills: Array.isArray(state.profile.skills) ? state.profile.skills : [],
    profilePictureName: state.profile.profile_picture_name || '',
    canManageClubs: hasPortalAccess()
  };

  if (typeof window.__ccSetCurrentUser === 'function') {
    window.__ccSetCurrentUser(mappedUser);
  } else {
    window.currentUser = { ...(window.currentUser || {}), ...mappedUser };
  }

  if (typeof window.updateUserUI === 'function') window.updateUserUI();
  if (typeof window.updateAccessUI === 'function') window.updateAccessUI();
  
  const prefName = document.getElementById('pref-name');
  const prefEmail = document.getElementById('pref-email');
  const prefMajor = document.getElementById('pref-major');
  if (prefName) prefName.value = mappedUser.name || '';
  if (prefEmail) prefEmail.value = mappedUser.email || '';
  if (prefMajor) prefMajor.value = mappedUser.department || '';
}


async function refreshData() {
  if (!state.user) return;

  const results = await Promise.allSettled([
    listClubs(),
    listProjects(),
    listHackathons(),
    listTeams(),
    listMyTeams(state.user.id),
    listMyMemberships(state.user.id),
    listMyRegistrations(state.user.id)
  ]);

  const [clubsRes, projectsRes, hackathonsRes, teamsRes, myTeamsRes, membershipsRes, registrationsRes] = results;

  state.clubs = clubsRes.status === 'fulfilled' ? clubsRes.value : [];
  state.projects = projectsRes.status === 'fulfilled' ? projectsRes.value : [];
  state.hackathons = hackathonsRes.status === 'fulfilled' ? hackathonsRes.value : [];
  state.teams = teamsRes.status === 'fulfilled' ? teamsRes.value : [];
  state.myTeams = myTeamsRes.status === 'fulfilled' ? myTeamsRes.value : [];
  state.memberships = membershipsRes.status === 'fulfilled' ? membershipsRes.value : [];
  state.registrations = registrationsRes.status === 'fulfilled' ? registrationsRes.value : [];

  const failed = results.filter((item) => item.status === 'rejected');
  if (failed.length) {
    const firstMessage = failed[0]?.reason?.message || 'Some data could not be loaded.';
    showToast(firstMessage);
  }

  renderClubs();
  renderProjects();
  renderHackathons();
  renderTeams();
  renderProfileSummary();
  renderManagementList();
  await loadTeamMembers();
  await renderDashboardSummary();
}

function getJoinedClubSet() {
  return new Set(state.memberships.map((item) => item.club_id));
}

function getRegisteredProjectSet() {
  return new Set(state.registrations.map((item) => item.project_id).filter(Boolean));
}

function getRegisteredHackathonSet() {
  return new Set(state.registrations.map((item) => item.hackathon_id).filter(Boolean));
}

function getMyTeamIdSet() {
  return new Set(state.myTeams.map((item) => item.team_id));
}

function getTeamMembershipCount(team) {
  return Array.isArray(team?.team_members) ? team.team_members.length : 0;
}

function renderJoinedItemHtml(title, subtitle, actionHtml = '') {
  return `
    <div class="club-list-item">
      <h4>${escapeHtml(title)}</h4>
      ${subtitle ? `<div class="club-list-meta"><span>${escapeHtml(subtitle)}</span></div>` : ''}
      ${actionHtml ? `<div style="margin-top:0.7rem;display:flex;gap:0.5rem;flex-wrap:wrap;">${actionHtml}</div>` : ''}
    </div>
  `;
}

function renderProfileSummary() {
  const skillsEl = document.getElementById('profile-skills-list');
  const clubsEl = document.getElementById('profile-joined-clubs-list');
  const registrationsEl = document.getElementById('profile-registrations-list');
  const teamsEl = document.getElementById('profile-joined-teams-list');

  if (skillsEl) {
    const skills = Array.isArray(state.profile?.skills) ? state.profile.skills : [];
    skillsEl.innerHTML = skills.length
      ? skills.map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')
      : '<span class="skill-tag">No skills added yet</span>';
  }

  if (clubsEl) {
    const clubs = state.memberships.filter((item) => item.clubs);
    clubsEl.innerHTML = clubs.length
      ? clubs
          .map((item) => {
            const club = item.clubs;
            return renderJoinedItemHtml(
              club.name,
              club.description,
              `
                <button class="btn-link" onclick="window.joinClubMembership(${club.id})"><i class="fas fa-check-circle"></i> Already joined</button>
                <button class="btn-link" onclick="window.leaveClubMembership(${club.id})"><i class="fas fa-times-circle"></i> Unenroll</button>
              `
            );
          })
          .join('')
      : '<div class="club-list-item"><h4>No clubs joined yet</h4></div>';
  }

  if (registrationsEl) {
    const regs = state.registrations.filter((item) => item.projects || item.hackathons);
    registrationsEl.innerHTML = regs.length
      ? regs
          .map((item) => {
            if (item.projects) {
              return renderJoinedItemHtml(
                item.projects.title,
                item.projects.description,
                `
                  <button class="btn-link" onclick="window.joinProjectRegistration(${item.projects.id})"><i class="fas fa-check-circle"></i> Already joined</button>
                  <button class="btn-link" onclick="window.leaveProjectRegistration(${item.projects.id})"><i class="fas fa-times-circle"></i> Unenroll</button>
                `
              );
            }

            return renderJoinedItemHtml(
              item.hackathons.title,
              item.hackathons.description,
              `
                <button class="btn-link" onclick="window.joinHackathonRegistration(${item.hackathons.id})"><i class="fas fa-check-circle"></i> Already joined</button>
                <button class="btn-link" onclick="window.leaveHackathonRegistration(${item.hackathons.id})"><i class="fas fa-times-circle"></i> Unenroll</button>
              `
            );
          })
          .join('')
      : '<div class="club-list-item"><h4>No registrations yet</h4></div>';
  }

  if (teamsEl) {
    const teams = state.myTeams.map((item) => item.teams).filter(Boolean);
    teamsEl.innerHTML = teams.length
      ? teams
          .map((team) => renderJoinedItemHtml(
            team.name,
            team.description,
            `
              <button class="btn-link" onclick="window.joinTeamMembership(${team.id})"><i class="fas fa-check-circle"></i> Already joined</button>
              <button class="btn-link" onclick="window.leaveTeamMembership(${team.id})"><i class="fas fa-times-circle"></i> Unenroll</button>
            `
          ))
          .join('')
      : '<div class="club-list-item"><h4>No teams joined yet</h4></div>';
  }
}

function renderTeams() {
  const list = document.getElementById('team-list');
  if (!list) return;

  const joinedSet = getMyTeamIdSet();
  if (!state.teams.length) {
    list.innerHTML = '<div class="club-list-item"><h4>No teams yet</h4><div class="club-list-meta"><span>Create a team to get started.</span></div></div>';
    return;
  }

  list.innerHTML = state.teams.map((team) => {
    const joined = joinedSet.has(team.id);
    const memberCount = getTeamMembershipCount(team);
    return `
      <div class="club-list-item">
        <h4>${escapeHtml(team.name)}</h4>
        <div class="club-list-meta"><span>${escapeHtml(team.description)}</span><span>${memberCount} members</span></div>
        <div style="margin-top:0.7rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn-link" onclick="window.joinTeamMembership(${team.id})"><i class="fas ${joined ? 'fa-check-circle' : 'fa-plus-circle'}"></i> ${joined ? 'Already joined' : 'Join'}</button>
          ${joined ? `<button class="btn-link" onclick="window.leaveTeamMembership(${team.id})"><i class="fas fa-times-circle"></i> Unenroll</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderClubs() {
  const grid = document.getElementById('clubs-grid');
  if (!grid) return;

  const joinedSet = getJoinedClubSet();

  if (!state.clubs.length) {
    grid.innerHTML = '<div class="dash-card"><h3>No clubs yet</h3><p>Club admins can create clubs from the Club Portal page.</p></div>';
    return;
  }

  grid.innerHTML = state.clubs
    .map((club) => {
      const joined = joinedSet.has(club.id);
      return `
        <div class="dash-card">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;"><i class="fas fa-users"></i></div>
          <h3>${escapeHtml(club.name)}</h3>
          <p>${escapeHtml(club.description)}</p>
          <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button class="btn-purple" style="font-size:0.8rem;padding:0.6rem 1rem;min-width:120px;" onclick="window.joinClubMembership(${club.id})">
              <i class="fas ${joined ? 'fa-check-circle' : 'fa-plus-circle'}"></i> ${joined ? 'Already joined' : 'Join Club'}
            </button>
            ${joined ? `<button class="btn-link" onclick="window.leaveClubMembership(${club.id})"><i class="fas fa-times-circle"></i> Unenroll</button>` : ''}
          </div>
        </div>
      `;
    })
    .join('');
}

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const registeredProjects = getRegisteredProjectSet();

  if (!state.projects.length) {
    grid.innerHTML = '<div class="dash-card"><h3>No projects yet</h3><p>Faculty users can create projects from the Club Portal page.</p></div>';
    return;
  }

  grid.innerHTML = state.projects
    .map((project) => {
      const isRegistered = registeredProjects.has(project.id);
      return `
        <div class="dash-card">
          <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:10px;height:100px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;margin-bottom:0.5rem;color:white;font-weight:700;">Project</div>
          <h3><i class="fas fa-folder-open"></i> ${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description)}</p>
          <div style="margin-top:0.8rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button class="btn-join" style="min-width:120px;" onclick="window.joinProjectRegistration(${project.id})">
              <i class="fas ${isRegistered ? 'fa-check-circle' : 'fa-plus-circle'}"></i> ${isRegistered ? 'Already joined' : 'Join Project'}
            </button>
            ${isRegistered ? `<button class="btn-link" onclick="window.leaveProjectRegistration(${project.id})"><i class="fas fa-times-circle"></i> Unenroll</button>` : ''}
          </div>
        </div>
      `;
    })
    .join('');
}

function renderHackathons(list = state.hackathons) {
  const grid = document.getElementById('hack-grid');
  if (!grid) return;

  const registeredHackathons = getRegisteredHackathonSet();

  if (!list.length) {
    grid.innerHTML = '<div class="club-list-item"><h4><i class="fas fa-search"></i> No hackathons found</h4><div class="club-list-meta"><span>Try changing your filter.</span></div></div>';
    return;
  }

  grid.innerHTML = list
    .map((item) => {
      const isRegistered = registeredHackathons.has(item.id);
      return `
        <div class="hack-card purple">
          <h3><i class="fas fa-flag-checkered"></i> ${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <p><strong>Date:</strong> ${escapeHtml(item.date)}</p>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button class="btn-join" onclick="window.joinHackathonRegistration(${item.id})">
              <i class="fas ${isRegistered ? 'fa-check-circle' : 'fa-plus-circle'}"></i> ${isRegistered ? 'Already joined' : 'Register'}
            </button>
            ${isRegistered ? `<button class="btn-link" onclick="window.leaveHackathonRegistration(${item.id})"><i class="fas fa-times-circle"></i> Unenroll</button>` : ''}
          </div>
        </div>
      `;
    })
    .join('');
}

function filterHackathons() {
  const skillText = (document.getElementById('filter-skills')?.value || '').toLowerCase().trim();
  const dateText = document.getElementById('filter-date')?.value || '';

  const filtered = state.hackathons.filter((hackathon) => {
    const inText = !skillText || `${hackathon.title} ${hackathon.description}`.toLowerCase().includes(skillText);
    const inDate = !dateText || hackathon.date >= dateText;
    return inText && inDate;
  });

  renderHackathons(filtered);
}

function roleLabel() {
  if (isAdminUser()) return 'admin';
  return state.profile?.role || 'student';
}

function renderManagementList() {
  const list = document.getElementById('club-hack-list');
  if (!list) return;

  const role = roleLabel();

  if (role === 'club_admin') {
    const ownClubs = state.clubs.filter((club) => club.created_by === state.user.id);
    list.innerHTML = ownClubs.length
      ? ownClubs
          .map(
            (club) => `
              <div class="club-list-item">
                <h4>${escapeHtml(club.name)}</h4>
                <div class="club-list-meta"><span>${escapeHtml(club.description)}</span></div>
                <div style="margin-top:0.7rem;display:flex;gap:0.5rem;">
                  <button class="btn-link" onclick="window.editManagedItem('club', ${club.id})"><i class="fas fa-pen"></i> Edit</button>
                  <button class="btn-link" onclick="window.deleteManagedItem('club', ${club.id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
              </div>
            `
          )
          .join('')
      : '<div class="club-list-item"><h4>No clubs created by you yet</h4></div>';
    return;
  }

  if (role === 'faculty') {
    const ownProjects = state.projects.filter((project) => project.created_by === state.user.id);
    list.innerHTML = ownProjects.length
      ? ownProjects
          .map(
            (project) => `
              <div class="club-list-item">
                <h4>${escapeHtml(project.title)}</h4>
                <div class="club-list-meta"><span>${escapeHtml(project.description)}</span></div>
                <div style="margin-top:0.7rem;display:flex;gap:0.5rem;">
                  <button class="btn-link" onclick="window.editManagedItem('project', ${project.id})"><i class="fas fa-pen"></i> Edit</button>
                  <button class="btn-link" onclick="window.deleteManagedItem('project', ${project.id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
              </div>
            `
          )
          .join('')
      : '<div class="club-list-item"><h4>No projects created by you yet</h4></div>';
    return;
  }

  if (role === 'admin') {
    list.innerHTML = state.hackathons.length
      ? state.hackathons
          .map(
            (hackathon) => `
              <div class="club-list-item">
                <h4>${escapeHtml(hackathon.title)}</h4>
                <div class="club-list-meta">
                  <span>${escapeHtml(hackathon.description)}</span>
                  <span><i class="fas fa-calendar"></i> ${escapeHtml(hackathon.date)}</span>
                </div>
                <div style="margin-top:0.7rem;display:flex;gap:0.5rem;">
                  <button class="btn-link" onclick="window.editManagedItem('hackathon', ${hackathon.id})"><i class="fas fa-pen"></i> Edit</button>
                  <button class="btn-link" onclick="window.deleteManagedItem('hackathon', ${hackathon.id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
              </div>
            `
          )
          .join('')
      : '<div class="club-list-item"><h4>No hackathons available yet</h4></div>';
    return;
  }

  list.innerHTML = '<div class="club-list-item"><h4>Only club admins, faculty, or admins can manage content.</h4></div>';
}

async function renderDashboardSummary() {
  const panelId = 'dashboard-supabase-panel';
  const dashboard = document.getElementById('page-dashboard');
  if (!dashboard || !state.user) return;

  let panel = document.getElementById(panelId);
  if (!panel) {
    panel = document.createElement('div');
    panel.id = panelId;
    panel.className = 'calendar-wrap';
    panel.style.marginTop = '1.5rem';
    panel.innerHTML = `
      <h3><i class="fas fa-database"></i> My Supabase Dashboard</h3>
      <div id="dashboard-joined-clubs" style="margin-top:0.8rem;"></div>
      <div id="dashboard-registered-events" style="margin-top:0.8rem;"></div>
      <div id="dashboard-joined-teams" style="margin-top:0.8rem;"></div>
    `;
    dashboard.querySelector('.dash-main-left')?.appendChild(panel);
  }

  const data = await fetchDashboard(state.user.id);

  const joinedEl = document.getElementById('dashboard-joined-clubs');
  const regEl = document.getElementById('dashboard-registered-events');

  const joinedNames = data.joinedClubs.map((x) => x.clubs?.name).filter(Boolean);
  const regNames = data.registrations.map((x) => x.projects?.title || x.hackathons?.title).filter(Boolean);
  const teamNames = state.myTeams.map((x) => x.teams?.name).filter(Boolean);

  if (joinedEl) {
    joinedEl.innerHTML = `<strong>Joined Clubs:</strong> ${joinedNames.length ? joinedNames.map(escapeHtml).join(', ') : 'None yet'}`;
  }

  if (regEl) {
    regEl.innerHTML = `<strong>Joined Projects/Hackathons:</strong> ${regNames.length ? regNames.map(escapeHtml).join(', ') : 'None yet'}`;
  }

  const teamEl = document.getElementById('dashboard-joined-teams');
  if (teamEl) {
    teamEl.innerHTML = `<strong>Joined Teams:</strong> ${teamNames.length ? teamNames.map(escapeHtml).join(', ') : 'None yet'}`;
  }
}

async function bootstrapSession() {
  const session = await getSession();
  state.session = session;
  state.user = session?.user || null;

  if (!state.user) {
    window.showView('view-login');
    return;
  }

  state.profile = await getMyProfile();

  if (!state.profile) {
    window.showView('view-profile-setup');
    showToast('Complete your profile setup to continue.');
    return;
  }

  applyProfileToLegacyUI();
  window.showView('view-app');
  if (typeof window.initCalendar === 'function') window.initCalendar();
  await refreshData();
}

function wireSupabaseAuthFlow() {
  window.validateSignupForm = function validateSignupForm() {
    const displayName = (document.getElementById('signup-username')?.value || '').trim();
    const email = (document.getElementById('signup-email')?.value || '').trim();
    const password = document.getElementById('signup-password')?.value || '';
    const confirm = document.getElementById('signup-confirm-password')?.value || '';
    const emailOk = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);
    const passwordOk = password.length >= 8;
    const confirmOk = Boolean(confirm) && password === confirm;
    const valid = emailOk && passwordOk && confirmOk;

    // Display name is optional in Supabase flow.
    setInlineErrorText('signup-username-error', '');
    setFieldContainerState('signup-username', displayName ? true : null);
    setInlineErrorText('signup-email-error', email ? (emailOk ? '' : 'Enter a valid email') : 'Email is required');
    setInlineErrorText('signup-password-error', password ? (passwordOk ? '' : 'Password must be at least 8 characters') : 'Password is required');
    setInlineErrorText('signup-confirm-password-error', confirm ? (confirmOk ? '' : 'Passwords do not match') : 'Confirm your password');

    setFieldContainerState('signup-email', email ? emailOk : false);
    setFieldContainerState('signup-password', password ? passwordOk : false);
    setFieldContainerState('signup-confirm-password', confirm ? confirmOk : false);

    const signupButton = document.getElementById('signup-submit');
    if (signupButton) signupButton.disabled = !valid;
    return valid;
  };

  window.validateProfileForm = function validateProfileForm() {
    const name = (document.getElementById('profile-full-name')?.value || '').trim();
    const dob = (document.getElementById('profile-dob')?.value || '').trim();
    const role = (document.getElementById('profile-role')?.value || '').trim();
    const reg = (document.getElementById('profile-reg')?.value || '').trim();
    const phone = (document.getElementById('profile-phone')?.value || '').trim();
    const dept = (document.getElementById('profile-dept')?.value || '').trim();
    const year = (document.getElementById('profile-year')?.value || '').trim();

    const skills = Array.from(document.querySelectorAll('.profile-skill-input'))
      .map((el) => (el.value || '').trim())
      .filter(Boolean);

    const nameOk = name.length >= 2;
    const dobOk = Boolean(dob);
    const roleOk = Boolean(role);
    const regOk = Boolean(reg);
    const phoneOk = Boolean(phone);
    const deptOk = Boolean(dept);
    const yearOk = Boolean(year);
    const skillsOk = skills.length > 0;

    const valid = nameOk && dobOk && roleOk && regOk && phoneOk && deptOk && yearOk && skillsOk;
    const submit = document.getElementById('profile-submit');
    if (submit) submit.disabled = !valid;

    setInlineErrorText('profile-full-name-error', nameOk ? '' : 'Full name is required');
    setInlineErrorText('profile-dob-error', dobOk ? '' : 'Date of birth is required');
    const roleErr = document.getElementById('profile-role-error');
    if (roleErr) roleErr.style.display = role ? 'none' : 'block';
    if (roleErr) roleErr.textContent = role ? '' : 'Role is required';

    setInlineErrorText('profile-reg-error', regOk ? '' : 'Registration number is required');
    setInlineErrorText('profile-phone-error', phoneOk ? '' : 'Phone number is required');
    setInlineErrorText('profile-dept-error', deptOk ? '' : 'Department / Branch is required');
    setInlineErrorText('profile-year-error', yearOk ? '' : 'Year of study is required');
    setInlineErrorText('profile-skills-error', skillsOk ? '' : 'Add at least one skill');

    setFieldContainerState('profile-full-name', name ? nameOk : false);
    setFieldContainerState('profile-dob', dob ? dobOk : false);
    setFieldContainerState('profile-role', role ? roleOk : false);
    setFieldContainerState('profile-reg', reg ? regOk : false);
    setFieldContainerState('profile-phone', phone ? phoneOk : false);
    setFieldContainerState('profile-dept', dept ? deptOk : false);
    setFieldContainerState('profile-year', year ? yearOk : false);

    return valid;
  };

  window.doSignup = async function doSignup() {
    if (!window.validateSignupForm()) {
      setError('Please use a valid email and matching passwords.');
      showToast('Please complete all signup fields correctly.');
      return;
    }

    clearError();
    setLoading('signup-submit', true, 'Creating Account...');

    try {
      const email = (document.getElementById('signup-email')?.value || '').trim();
      const password = document.getElementById('signup-password')?.value || '';

      const signUpResult = await signUpWithEmail(email, password);
      const activeSession = signUpResult?.session || null;
      const signedInUser = activeSession?.user || null;

      if (signedInUser) {
        state.session = activeSession;
        state.user = signedInUser;
        clearError();
        setSignupBanner('');
        showToast('Account created. Continue with profile setup.');
        window.showView('view-profile-setup');
        window.validateProfileForm();
      } else {
        setSignupBanner('Signup successful, but email verification is required. Please verify your email, then sign in to continue profile setup.');
        showToast('Email verification required. Check your inbox, then sign in.');
        window.showView('view-login');
        const loginInput = document.getElementById('login-user');
        if (loginInput) loginInput.value = email;
      }
    } catch (error) {
      setError(error.message);
      setInlineErrorText('signup-email-error', error.message || 'Signup failed');
      showToast(error.message || 'Signup failed');
    } finally {
      setLoading('signup-submit', false, 'Creating Account...');
    }
  };

  window.doLogin = async function doLogin() {
    clearError();
    setLoading('login-submit', true, 'Signing In...');

    try {
      const email = (document.getElementById('login-user')?.value || '').trim();
      const password = document.getElementById('login-pass')?.value || '';

      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      await signInWithEmail(email, password);
      setSignupBanner('');
      await bootstrapSession();
      showToast('Signed in successfully.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading('login-submit', false, 'Signing In...');
    }
  };

  window.completeProfileSetup = async function completeProfileSetup() {
    if (!window.validateProfileForm()) {
      showToast('Please fill all required profile fields.');
      return;
    }

    setLoading('profile-submit', true, 'Saving Profile...');

    try {
      const user = await getCurrentUser();
      if (!user) {
        window.showView('view-login');
        throw new Error('Auth session missing. Please sign in again and then complete profile setup.');
      }

      const payload = {
        id: user.id,
        full_name: (document.getElementById('profile-full-name')?.value || '').trim(),
        dob: (document.getElementById('profile-dob')?.value || '').trim(),
        role: (document.getElementById('profile-role')?.value || 'student').trim(),
        registration_number: (document.getElementById('profile-reg')?.value || '').trim(),
        phone: (document.getElementById('profile-phone')?.value || '').trim(),
        department: (document.getElementById('profile-dept')?.value || '').trim(),
        year: (document.getElementById('profile-year')?.value || '').trim(),
        specialization: (document.getElementById('profile-specialization')?.value || '').trim(),
        skills: getNormalizedSkills(),
        profile_picture_name: (document.getElementById('profile-picture').files[0] || {}).name || '',
        bio: (document.getElementById('edit-bio')?.value || '').trim(),
        linkedin: (document.getElementById('profile-linkedin')?.value || '').trim(),
        github: (document.getElementById('profile-github')?.value || '').trim()
      };

      await upsertProfile(payload);
      await bootstrapSession();
      showToast('Profile setup complete.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading('profile-submit', false, 'Saving Profile...');
    }
  };

  window.doLogout = async function doLogout() {
    try {
      await signOutCurrentUser();
      state.session = null;
      state.user = null;
      state.profile = null;
      clearError();
      window.showView('view-login');
      showToast('You have been signed out.');
    } catch (error) {
      showToast(error.message);
    }
  };

  window.setLoginRole = function setLoginRole() {
    showToast('Role selection happens from your profile role and admin metadata.');
  };

  window.toggleTeamMembership = async function toggleTeamMembership(teamId) {
    if (!state.user) return;
    if (getMyTeamIdSet().has(teamId)) {
      await leaveTeamMembership(teamId);
      return;
    }
    await joinTeamMembership(teamId);
  };

  window.joinTeamMembership = async function joinTeamMembership(teamId) {
    if (!state.user) return;
    if (getMyTeamIdSet().has(teamId)) {
      showToast('You have already joined this team.');
      return;
    }
    await joinTeamRecord(state.user.id, teamId);
    await refreshData();
    showToast('Joined team successfully.');
  };

  window.leaveTeamMembership = async function leaveTeamMembership(teamId) {
    if (!state.user) return;
    if (!getMyTeamIdSet().has(teamId)) {
      showToast('You are not enrolled in this team.');
      return;
    }
    await leaveTeamRecord(state.user.id, teamId);
    await refreshData();
    showToast('Left team successfully.');
  };

  window.createTeam = async function createTeam() {
    if (!state.user) return;
    const name = (document.getElementById('team-name')?.value || '').trim();
    const description = (document.getElementById('team-desc')?.value || '').trim();
    if (!name || !description) {
      showToast('Please enter a team name and description');
      return;
    }

    await createTeamRecord({
      name,
      description,
      tags: [],
      created_by: state.user.id
    });

    const teamNameInput = document.getElementById('team-name');
    const teamDescInput = document.getElementById('team-desc');
    if (teamNameInput) teamNameInput.value = '';
    if (teamDescInput) teamDescInput.value = '';

    await refreshData();
    showToast('Team created successfully.');
  };

  const signupFieldIds = ['signup-username', 'signup-email', 'signup-password', 'signup-confirm-password'];
  signupFieldIds.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    ['input', 'change', 'blur', 'keyup', 'paste'].forEach((eventName) => {
      input.addEventListener(eventName, () => {
        setSignupBanner('');
        window.validateSignupForm();
      });
    });
  });

  // Autofill-safe validation passes.
  [50, 250, 750, 1500].forEach((delay) => {
    setTimeout(() => window.validateSignupForm(), delay);
  });
}

function wireEntityActions() {
  window.toggleClubMembership = async function toggleClubMembership(clubId) {
    if (!state.user) return;
    if (getJoinedClubSet().has(clubId)) {
      await leaveClubMembership(clubId);
      return;
    }
    await joinClubMembership(clubId);
  };

  window.joinClubMembership = async function joinClubMembership(clubId) {
    if (!state.user) return;
    if (getJoinedClubSet().has(clubId)) {
      showToast('You have already joined this club.');
      return;
    }
    await joinClub(state.user.id, clubId);
    await refreshData();
    showToast('Joined club successfully.');
  };

  window.leaveClubMembership = async function leaveClubMembership(clubId) {
    if (!state.user) return;
    if (!getJoinedClubSet().has(clubId)) {
      showToast('You are not enrolled in this club.');
      return;
    }
    await leaveClub(state.user.id, clubId);
    await refreshData();
    showToast('Left club successfully.');
  };

  window.toggleProjectRegistration = async function toggleProjectRegistration(projectId) {
    if (!state.user) return;
    if (getRegisteredProjectSet().has(projectId)) {
      await leaveProjectRegistration(projectId);
      return;
    }
    await joinProjectRegistration(projectId);
  };

  window.joinProjectRegistration = async function joinProjectRegistration(projectId) {
    if (!state.user) return;
    if (getRegisteredProjectSet().has(projectId)) {
      showToast('You have already joined this project.');
      return;
    }
    await registerProject(state.user.id, projectId);
    await refreshData();
    showToast('Project joined successfully.');
  };

  window.leaveProjectRegistration = async function leaveProjectRegistration(projectId) {
    if (!state.user) return;
    if (!getRegisteredProjectSet().has(projectId)) {
      showToast('You are not enrolled in this project.');
      return;
    }
    await unregisterProject(state.user.id, projectId);
    await refreshData();
    showToast('Project unenrolled successfully.');
  };

  window.toggleHackathonRegistration = async function toggleHackathonRegistration(hackathonId) {
    if (!state.user) return;
    if (getRegisteredHackathonSet().has(hackathonId)) {
      await leaveHackathonRegistration(hackathonId);
      return;
    }
    await joinHackathonRegistration(hackathonId);
  };

  window.joinHackathonRegistration = async function joinHackathonRegistration(hackathonId) {
    if (!state.user) return;
    if (getRegisteredHackathonSet().has(hackathonId)) {
      showToast('You have already joined this hackathon.');
      return;
    }
    await registerHackathon(state.user.id, hackathonId);
    await refreshData();
    showToast('Hackathon registered.');
  };

  window.leaveHackathonRegistration = async function leaveHackathonRegistration(hackathonId) {
    if (!state.user) return;
    if (!getRegisteredHackathonSet().has(hackathonId)) {
      showToast('You are not enrolled in this hackathon.');
      return;
    }
    await unregisterHackathon(state.user.id, hackathonId);
    await refreshData();
    showToast('Hackathon unenrolled successfully.');
  };

  window.filterHackathons = filterHackathons;

  window.createClubHackathon = async function createClubHackathon() {
    if (!state.user || !state.profile) {
      showToast('Login first.');
      return;
    }

    const title = (document.getElementById('club-hack-name')?.value || '').trim();
    const description = (document.getElementById('club-description')?.value || '').trim();
    const date = (document.getElementById('club-start-date')?.value || '').trim();
    const clubName = (document.getElementById('club-name')?.value || '').trim();

    try {
      if (isAdminUser()) {
        if (!title || !description || !date) throw new Error('Admin: title, date, and description are required.');
        await createHackathon({ title, description, date, created_by: state.user.id });
        showToast('Hackathon created.');
      } else if (state.profile.role === 'faculty') {
        if (!title || !description) throw new Error('Faculty: title and description are required.');
        await createProject({ title, description, created_by: state.user.id });
        showToast('Project created.');
      } else if (state.profile.role === 'club_admin') {
        if (!clubName || !description) throw new Error('Club admin: club name and description are required.');
        await createClub({ name: clubName, description, created_by: state.user.id });
        showToast('Club created.');
      } else {
        throw new Error('You are not allowed to create content.');
      }

      ['club-hack-name', 'club-description', 'club-start-date', 'club-name', 'club-skills', 'club-team-size', 'club-prize'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
      });

      await refreshData();
    } catch (error) {
      showToast(error.message);
    }
  };

  window.editManagedItem = async function editManagedItem(type, id) {
    try {
      if (type === 'club') {
        const current = state.clubs.find((item) => item.id === id);
        if (!current) return;
        const name = window.prompt('New club name:', current.name);
        const description = window.prompt('New club description:', current.description);
        if (!name || !description) return;
        await updateClub(id, { name, description });
      }

      if (type === 'project') {
        const current = state.projects.find((item) => item.id === id);
        if (!current) return;
        const title = window.prompt('New project title:', current.title);
        const description = window.prompt('New project description:', current.description);
        if (!title || !description) return;
        await updateProject(id, { title, description });
      }

      if (type === 'hackathon') {
        const current = state.hackathons.find((item) => item.id === id);
        if (!current) return;
        const title = window.prompt('New hackathon title:', current.title);
        const description = window.prompt('New hackathon description:', current.description);
        const date = window.prompt('New hackathon date (YYYY-MM-DD):', current.date);
        if (!title || !description || !date) return;
        await updateHackathon(id, { title, description, date });
      }

      await refreshData();
      showToast('Item updated.');
    } catch (error) {
      showToast(error.message);
    }
  };

  window.deleteManagedItem = async function deleteManagedItem(type, id) {
    try {
      if (type === 'club') await deleteClub(id);
      if (type === 'project') await deleteProject(id);
      if (type === 'hackathon') await deleteHackathon(id);
      await refreshData();
      showToast('Item deleted.');
    } catch (error) {
      showToast(error.message);
    }
  };
}

function hideLegacyRoleSwitcher() {
  const switcher = document.getElementById('login-role-switch');
  const hint = document.getElementById('login-role-hint');
  if (switcher) switcher.style.display = 'none';
  if (hint) hint.innerHTML = '<i class="fas fa-info-circle"></i> Login using your Supabase email and password.';
}

async function runConnectivityProbe() {
  if (!hasSupabaseConfig) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase responded with HTTP ${response.status}`);
    }
  } catch (error) {
    const runningFromFile = window.location.protocol === 'file:';
    const details = runningFromFile
      ? 'Open the app via http://localhost (not file://) using a local server.'
      : 'Check VPN/adblock/firewall and verify the Supabase project is active.';

    throw new Error(`Supabase connectivity test failed. ${details}`);
  }
}

async function runSchemaProbe() {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id, full_name, registration_number, phone, department, year, specialization, skills, profile_picture_name, bio, linkedin, github')
      .limit(1);

    if (error) throw error;
  } catch (error) {
    if (isSchemaMissingError(error)) {
      throw new Error(
        'Supabase schema is missing or outdated. Open Supabase SQL Editor, run supabase/schema.sql fully, wait 10-20 seconds, then reload this page.'
      );
    }
    throw error;
  }
}

async function init() {
  prepareDynamicContainers();
  wireSupabaseAuthFlow();
  wireEntityActions();
  hideLegacyRoleSwitcher();

  if (!hasSupabaseConfig) {
    setError('Configure Supabase URL and anon key in window.CAMPUS_CONNECT_CONFIG before using auth.');
    window.showView('view-login');
    return;
  }

  await runConnectivityProbe();

  try {
    await runSchemaProbe();
  } catch (error) {
    if (isSchemaMissingError(error)) {
      setSchemaSetupGuidance(error.message);
      window.showView('view-login');
      return;
    }
    throw error;
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    state.user = session?.user || null;
    if (!state.user) {
      window.showView('view-login');
      return;
    }

    state.profile = await getMyProfile();
    if (state.profile) {
      applyProfileToLegacyUI();
      window.showView('view-app');
      await refreshData();
    }
  });

  await bootstrapSession();
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error(error);
    if (isSchemaMissingError(error)) {
      setSchemaSetupGuidance(error.message);
    } else {
      setError(error.message || 'Supabase initialization failed.');
    }
  });
});
async function loadCommunityProfiles() {
  const feed = document.getElementById('community-feed');
  if (!feed) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, department, year, skills, bio, role')
    .order('created_at', { ascending: false });

  if (error) {
    feed.innerHTML = '<div class="club-list-item"><h4>Could not load profiles</h4></div>';
    return;
  }

  if (!data || data.length === 0) {
    feed.innerHTML = '<div class="club-list-item"><h4>No users found yet</h4></div>';
    return;
  }

  feed.innerHTML = data.map(p => {
    const initials = (p.full_name || 'U')
      .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const skills = Array.isArray(p.skills) ? p.skills : [];
    return `
      <div class="community-card">
        <div class="community-head">
          <div class="community-avatar">${initials}</div>
          <div>
            <div class="community-title">${p.full_name || 'Unknown'}</div>
            <div class="community-sub">${p.role || 'student'} • ${p.department || ''}</div>
          </div>
        </div>
        <div class="community-sub" style="margin-top:0.4rem;">${p.bio || 'No bio added yet.'}</div>
        <div class="community-tags">
          ${skills.map(s => `<span class="community-tag">${s}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (document.getElementById('page-community')?.classList.contains('active')) {
      loadCommunityProfiles();
    }
  });
});

async function loadTeamMembers() {
  const membersGrid = document.querySelector('.members-grid');
  if (!membersGrid) return;

  const { data, error } = await supabase
    .from('team_members')
    .select('user_id, profiles(full_name, department, year, role, skills)')
    .order('joined_at', { ascending: true });

  if (error || !data || !data.length) return;

  membersGrid.innerHTML = data.map(m => {
    const p = m.profiles;
    const initials = (p.full_name || 'U')
      .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const role = p.role === 'faculty' ? 'Faculty' :
                 p.role === 'club_admin' ? 'Club Admin' : 'Student';
    return `
      <div class="member-card">
        <div class="member-avatar">${initials}</div>
        <div class="member-name">${p.full_name || 'Unknown'}</div>
        <div class="member-role">${role} • ${p.department || ''}</div>
      </div>
    `;
  }).join('');
}