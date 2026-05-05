import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: 'fa-bolt' },
  upcoming:  { label: 'Upcoming',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: 'fa-clock' },
  completed: { label: 'Completed', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: 'fa-check-circle' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: 'fa-times-circle' },
};

const EMPTY_FORM = {
  title: '', description: '', date: '', end_date: '', prize: '',
  max_participants: 50, status: 'upcoming', tags: '',
  location: 'Online', image_url: '',
};

export default function HackathonsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [registeredSet, setRegisteredSet] = useState(new Set());
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('browse'); // browse | admin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedCard, setExpandedCard] = useState(null);
  const [participantProfiles, setParticipantProfiles] = useState({});
  const [loadingParticipants, setLoadingParticipants] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = profile?.role === 'club_admin' || profile?.role === 'faculty';

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: h }, { data: myRegs }, { data: allRegs }] = await Promise.all([
      supabase.from('hackathons').select('*').order('date', { ascending: true }),
      supabase.from('registrations').select('hackathon_id').eq('user_id', user.id),
      supabase.from('registrations').select('hackathon_id, user_id, registered_at'),
    ]);
    setHackathons(h || []);
    setRegisteredSet(new Set((myRegs || []).map(x => x.hackathon_id).filter(Boolean)));
    setAllRegistrations(allRegs || []);
  }

  async function toggleReg(id) {
    if (registeredSet.has(id)) {
      await supabase.from('registrations').delete().eq('user_id', user.id).eq('hackathon_id', id);
      showToast('Unregistered from hackathon.');
    } else {
      const hack = hackathons.find(h => h.id === id);
      const count = allRegistrations.filter(r => r.hackathon_id === id).length;
      if (hack?.max_participants && count >= hack.max_participants) {
        showToast('This hackathon is full!');
        return;
      }
      await supabase.from('registrations').insert({ user_id: user.id, hackathon_id: id });
      showToast('Registered for hackathon!');
    }
    load();
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingHackathon(null);
    setShowCreateModal(true);
  }

  function openEdit(h) {
    setForm({
      title: h.title || '',
      description: h.description || '',
      date: h.date || '',
      end_date: h.end_date || '',
      prize: h.prize || '',
      max_participants: h.max_participants || 50,
      status: h.status || 'upcoming',
      tags: (h.tags || []).join(', '),
      location: h.location || 'Online',
      image_url: h.image_url || '',
    });
    setEditingHackathon(h);
    setShowCreateModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.date) {
      showToast('Please fill title, description, and start date.');
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      end_date: form.end_date || form.date,
      prize: form.prize.trim(),
      max_participants: parseInt(form.max_participants) || 50,
      status: form.status,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      location: form.location.trim(),
      image_url: form.image_url.trim(),
      created_by: user.id,
    };

    let error;
    if (editingHackathon) {
      ({ error } = await supabase.from('hackathons').update(payload).eq('id', editingHackathon.id));
    } else {
      ({ error } = await supabase.from('hackathons').insert(payload));
    }
    setSubmitting(false);
    if (error) { showToast(error.message); return; }
    setShowCreateModal(false);
    showToast(editingHackathon ? 'Hackathon updated!' : 'Hackathon created!');
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this hackathon? All registrations will also be removed.')) return;
    await supabase.from('registrations').delete().eq('hackathon_id', id);
    await supabase.from('hackathons').delete().eq('id', id);
    showToast('Hackathon deleted.');
    load();
  }

  async function loadParticipants(hackathonId) {
    if (expandedCard === hackathonId) { setExpandedCard(null); return; }
    setExpandedCard(hackathonId);
    setLoadingParticipants(hackathonId);
    const regs = allRegistrations.filter(r => r.hackathon_id === hackathonId);
    const userIds = regs.map(r => r.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, skills, role').in('id', userIds);
      const map = {};
      (profiles || []).forEach(p => { map[p.id] = p; });
      setParticipantProfiles(prev => ({ ...prev, [hackathonId]: { profiles: map, regs } }));
    } else {
      setParticipantProfiles(prev => ({ ...prev, [hackathonId]: { profiles: {}, regs: [] } }));
    }
    setLoadingParticipants(null);
  }

  function getRegCount(id) {
    return allRegistrations.filter(r => r.hackathon_id === id).length;
  }

  function getFillPercent(h) {
    const count = getRegCount(h.id);
    return h.max_participants ? Math.min(100, Math.round((count / h.max_participants) * 100)) : 0;
  }

  const filtered = useMemo(() => {
    return hackathons.filter(h => {
      const matchSearch = !filter || `${h.title} ${h.description} ${(h.tags || []).join(' ')}`.toLowerCase().includes(filter.toLowerCase());
      const matchStatus = statusFilter === 'all' || h.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [hackathons, filter, statusFilter]);

  // Admin stats
  const totalParticipants = new Set(allRegistrations.map(r => r.user_id)).size;
  const activeHackathons = hackathons.filter(h => h.status === 'active').length;
  const upcomingHackathons = hackathons.filter(h => h.status === 'upcoming').length;
  const myHackathons = hackathons.filter(h => h.created_by === user.id);

  return (
    <>
      {/* View Toggle for Admins */}
      {isAdmin && (
        <div className="hack-view-toggle">
          <button
            className={`hack-toggle-btn ${viewMode === 'browse' ? 'active' : ''}`}
            onClick={() => setViewMode('browse')}
          >
            <i className="fas fa-globe"></i> Browse Hackathons
          </button>
          <button
            className={`hack-toggle-btn ${viewMode === 'admin' ? 'active' : ''}`}
            onClick={() => setViewMode('admin')}
          >
            <i className="fas fa-chart-bar"></i> Admin Dashboard
          </button>
        </div>
      )}

      {/* ============ ADMIN DASHBOARD ============ */}
      {viewMode === 'admin' && isAdmin ? (
        <div className="hack-admin-wrap">
          {/* Stats Row */}
          <div className="hack-stats-row">
            <div className="hack-stat-card">
              <div className="hack-stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                <i className="fas fa-trophy"></i>
              </div>
              <div className="hack-stat-info">
                <div className="hack-stat-value">{hackathons.length}</div>
                <div className="hack-stat-label">Total Hackathons</div>
              </div>
            </div>
            <div className="hack-stat-card">
              <div className="hack-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <i className="fas fa-bolt"></i>
              </div>
              <div className="hack-stat-info">
                <div className="hack-stat-value">{activeHackathons}</div>
                <div className="hack-stat-label">Active Now</div>
              </div>
            </div>
            <div className="hack-stat-card">
              <div className="hack-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <i className="fas fa-users"></i>
              </div>
              <div className="hack-stat-info">
                <div className="hack-stat-value">{totalParticipants}</div>
                <div className="hack-stat-label">Total Participants</div>
              </div>
            </div>
            <div className="hack-stat-card">
              <div className="hack-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
                <i className="fas fa-calendar-plus"></i>
              </div>
              <div className="hack-stat-info">
                <div className="hack-stat-value">{upcomingHackathons}</div>
                <div className="hack-stat-label">Upcoming</div>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="hack-admin-toolbar">
            <h2><i className="fas fa-cogs"></i> Manage Hackathons</h2>
            <button className="btn-create-hack" onClick={openCreate}>
              <i className="fas fa-plus"></i> Create Hackathon
            </button>
          </div>

          {/* Admin Hackathon List */}
          <div className="hack-admin-list">
            {hackathons.length === 0 && (
              <div className="hack-empty-state">
                <i className="fas fa-rocket"></i>
                <h3>No hackathons yet</h3>
                <p>Create your first hackathon and start building!</p>
              </div>
            )}
            {hackathons.map(h => {
              const regCount = getRegCount(h.id);
              const fillPct = getFillPercent(h);
              const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.upcoming;
              const isExpanded = expandedCard === h.id;
              const participants = participantProfiles[h.id];
              return (
                <div className={`hack-admin-card ${isExpanded ? 'expanded' : ''}`} key={h.id}>
                  <div className="hack-admin-card-header">
                    <div className="hack-admin-card-left">
                      {h.image_url && <img src={h.image_url} alt={h.title} className="hack-admin-thumb" />}
                      <div>
                        <h3>{h.title}</h3>
                        <div className="hack-admin-meta">
                          <span className="hack-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
                            <i className={`fas ${cfg.icon}`}></i> {cfg.label}
                          </span>
                          <span><i className="fas fa-calendar"></i> {h.date}{h.end_date && h.end_date !== h.date ? ` → ${h.end_date}` : ''}</span>
                          <span><i className="fas fa-map-marker-alt"></i> {h.location || 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="hack-admin-card-right">
                      <div className="hack-admin-participants-badge">
                        <i className="fas fa-users"></i>
                        <span className="hack-admin-count">{regCount}</span>
                        <span className="hack-admin-max">/ {h.max_participants || '∞'}</span>
                      </div>
                      <div className="hack-fill-bar-wrap">
                        <div className="hack-fill-bar">
                          <div
                            className="hack-fill-bar-inner"
                            style={{
                              width: `${fillPct}%`,
                              background: fillPct > 80 ? 'linear-gradient(90deg, #ef4444, #f97316)' :
                                         fillPct > 50 ? 'linear-gradient(90deg, #f59e0b, #eab308)' :
                                                        'linear-gradient(90deg, #6366f1, #8b5cf6)'
                            }}
                          ></div>
                        </div>
                        <span className="hack-fill-text">{fillPct}% filled</span>
                      </div>
                    </div>
                  </div>

                  <p className="hack-admin-desc">{h.description}</p>

                  {h.tags && h.tags.length > 0 && (
                    <div className="hack-admin-tags">
                      {h.tags.map((tag, i) => <span key={i} className="hack-tag">{tag}</span>)}
                    </div>
                  )}

                  {h.prize && (
                    <div className="hack-prize-row">
                      <i className="fas fa-gift"></i> <strong>Prize:</strong> {h.prize}
                    </div>
                  )}

                  <div className="hack-admin-actions">
                    <button className="btn-hack-action view" onClick={() => loadParticipants(h.id)}>
                      <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      {isExpanded ? 'Hide' : 'View'} Participants ({regCount})
                    </button>
                    <button className="btn-hack-action edit" onClick={() => openEdit(h)}>
                      <i className="fas fa-pen"></i> Edit
                    </button>
                    <button className="btn-hack-action delete" onClick={() => handleDelete(h.id)}>
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>

                  {/* Expanded Participants Panel */}
                  {isExpanded && (
                    <div className="hack-participants-panel">
                      {loadingParticipants === h.id ? (
                        <div className="hack-loading"><i className="fas fa-spinner fa-spin"></i> Loading participants...</div>
                      ) : participants && participants.regs.length > 0 ? (
                        <>
                          <div className="hack-participants-header">
                            <h4><i className="fas fa-user-friends"></i> Registered Participants</h4>
                            <span className="hack-participants-total">{participants.regs.length} registered</span>
                          </div>
                          <div className="hack-participants-grid">
                            {participants.regs.map((reg, i) => {
                              const p = participants.profiles[reg.user_id];
                              const initials = (p?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                              return (
                                <div className="hack-participant-card" key={i}>
                                  <div className="hack-participant-avatar">{initials}</div>
                                  <div className="hack-participant-info">
                                    <div className="hack-participant-name">{p?.full_name || 'Unknown User'}</div>
                                    <div className="hack-participant-role">{p?.role || 'student'}</div>
                                    {p?.skills && (
                                      <div className="hack-participant-skills">
                                        {(Array.isArray(p.skills) ? p.skills : p.skills.split(',')).slice(0, 3).map((s, j) => (
                                          <span key={j} className="hack-skill-mini">{s.trim()}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="hack-participant-date">
                                    {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '—'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="hack-no-participants">
                          <i className="fas fa-user-slash"></i>
                          <p>No participants registered yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ============ BROWSE VIEW ============ */
        <>
          <div className="filter-bar">
            <input
              className="filter-input"
              placeholder="Search hackathons, skills, technologies..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <div className="hack-status-filters">
              {['all', 'active', 'upcoming', 'completed'].map(s => (
                <button
                  key={s}
                  className={`hack-filter-pill ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
                </button>
              ))}
            </div>
            {isAdmin && (
              <button className="btn-create-hack compact" onClick={openCreate}>
                <i className="fas fa-plus"></i> New
              </button>
            )}
          </div>
          <div className="hack-grid">
            {filtered.length === 0 && (
              <div className="hack-empty-state">
                <i className="fas fa-search"></i>
                <h3>No hackathons found</h3>
                <p>Try adjusting your filters or check back later.</p>
              </div>
            )}
            {filtered.map(h => {
              const isReg = registeredSet.has(h.id);
              const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.upcoming;
              const regCount = getRegCount(h.id);
              const fillPct = getFillPercent(h);
              return (
                <div className={`hack-card-v2 ${h.status}`} key={h.id}>
                  {h.image_url && (
                    <div className="hack-card-img-wrap">
                      <img src={h.image_url} alt={h.title} />
                      <div className="hack-card-status" style={{ color: cfg.color, background: cfg.bg }}>
                        <i className={`fas ${cfg.icon}`}></i> {cfg.label}
                      </div>
                    </div>
                  )}
                  {!h.image_url && (
                    <div className="hack-card-status floating" style={{ color: cfg.color, background: cfg.bg }}>
                      <i className={`fas ${cfg.icon}`}></i> {cfg.label}
                    </div>
                  )}
                  <div className="hack-card-body">
                    <h3><i className="fas fa-flag-checkered"></i> {h.title}</h3>
                    <p className="hack-card-desc">{h.description}</p>
                    <div className="hack-card-details">
                      <span><i className="fas fa-calendar-alt"></i> {h.date}</span>
                      <span><i className="fas fa-map-marker-alt"></i> {h.location || 'TBD'}</span>
                    </div>
                    {h.prize && (
                      <div className="hack-card-prize">
                        <i className="fas fa-gift"></i> {h.prize}
                      </div>
                    )}
                    {h.tags && h.tags.length > 0 && (
                      <div className="hack-card-tags">
                        {h.tags.map((tag, i) => <span key={i} className="hack-tag">{tag}</span>)}
                      </div>
                    )}
                    <div className="hack-card-footer">
                      <div className="hack-card-participants">
                        <div className="hack-fill-bar-sm">
                          <div className="hack-fill-bar-inner" style={{ width: `${fillPct}%` }}></div>
                        </div>
                        <span>{regCount}/{h.max_participants || '∞'} registered</span>
                      </div>
                      <div className="hack-card-btns">
                        <button
                          className={`btn-join-hack ${isReg ? 'registered' : ''}`}
                          onClick={() => toggleReg(h.id)}
                          disabled={h.status === 'completed' || h.status === 'cancelled'}
                        >
                          <i className={`fas ${isReg ? 'fa-check-circle' : 'fa-plus-circle'}`}></i>
                          {isReg ? 'Registered' : 'Register'}
                        </button>
                        <button className="btn-link" onClick={() => navigate('/team')}>
                          <i className="fas fa-users"></i> Team
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ============ CREATE/EDIT MODAL ============ */}
      {showCreateModal && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="hack-modal">
            <div className="hack-modal-header">
              <h2><i className={`fas ${editingHackathon ? 'fa-pen' : 'fa-rocket'}`}></i> {editingHackathon ? 'Edit Hackathon' : 'Create New Hackathon'}</h2>
              <button className="hack-modal-close" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="hack-form">
              <div className="hack-form-grid">
                <div className="hack-form-field full">
                  <label>Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. WebDev Blitz 2026"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="hack-form-field full">
                  <label>Description *</label>
                  <textarea
                    placeholder="Describe the hackathon, themes, rules..."
                    rows={3}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="hack-form-field">
                  <label>Start Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="hack-form-field">
                  <label>End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
                <div className="hack-form-field">
                  <label>Prize</label>
                  <input type="text" placeholder="₹50,000 + Internship" value={form.prize} onChange={e => setForm({ ...form, prize: e.target.value })} />
                </div>
                <div className="hack-form-field">
                  <label>Max Participants</label>
                  <input type="number" min="1" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} />
                </div>
                <div className="hack-form-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="hack-form-field">
                  <label>Location</label>
                  <input type="text" placeholder="Online / Campus Hall" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="hack-form-field full">
                  <label>Tags (comma separated)</label>
                  <input type="text" placeholder="React, Node.js, AI, Web3" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
                <div className="hack-form-field full">
                  <label>Image URL (optional)</label>
                  <input type="url" placeholder="https://images.unsplash.com/..." value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                </div>
              </div>
              <div className="hack-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm" disabled={submitting}>
                  {submitting ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> {editingHackathon ? 'Update' : 'Create'} Hackathon</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
