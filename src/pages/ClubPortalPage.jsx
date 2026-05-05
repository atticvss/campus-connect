import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

export default function ClubPortalPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [hackathons, setHackathons] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: c }, { data: h }, { data: regs }] = await Promise.all([
      supabase.from('clubs').select('*').order('created_at', { ascending: false }),
      supabase.from('hackathons').select('*').order('date', { ascending: false }),
      supabase.from('registrations').select('hackathon_id, user_id'),
    ]);
    setClubs(c || []);
    setHackathons(h || []);
    setAllRegistrations(regs || []);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !desc.trim()) { showToast('Fill all fields'); return; }
    const { error } = await supabase.from('clubs').insert({ name, description: desc, created_by: user.id });
    if (error) { showToast(error.message); return; }
    setName(''); setDesc('');
    load();
    showToast('Club created!');
  }

  async function handleDelete(id) {
    await supabase.from('clubs').delete().eq('id', id);
    load();
    showToast('Club deleted.');
  }

  function getRegCount(hackId) {
    return allRegistrations.filter(r => r.hackathon_id === hackId).length;
  }

  const canManage = profile?.role === 'club_admin' || profile?.role === 'faculty';
  const myHackathons = hackathons.filter(h => h.created_by === user.id);
  const totalRegs = new Set(allRegistrations.map(r => r.user_id)).size;

  return (
    <>
      <div className="club-portal-layout">
        <div className="club-portal-card">
          <h3><i className="fas fa-plus-circle"></i> Create New Club</h3>
          {!canManage && <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Only club admins can create clubs.</p>}
          {canManage && (
            <form onSubmit={handleCreate}>
              <div className="club-form-grid">
                <input className="team-input" placeholder="Club Name" value={name} onChange={e => setName(e.target.value)} />
                <input className="team-input full" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <button className="btn-primary" style={{ marginTop: '1rem' }}>Create Club</button>
            </form>
          )}
        </div>
        <div className="club-portal-card">
          <h3><i className="fas fa-list"></i> Existing Clubs</h3>
          <div className="club-list">
            {clubs.map(c => (
              <div className="club-list-item" key={c.id}>
                <h4>{c.name}</h4>
                <div className="club-list-meta"><span>{c.description}</span></div>
                {c.created_by === user.id && <button className="btn-link" style={{ marginTop: '0.5rem' }} onClick={() => handleDelete(c.id)}><i className="fas fa-trash"></i> Delete</button>}
              </div>
            ))}
            {clubs.length === 0 && <div className="club-list-item"><h4>No clubs yet</h4></div>}
          </div>
        </div>
      </div>

      {/* Hackathon Quick Overview for Admins */}
      {canManage && (
        <div className="portal-hack-section">
          <div className="portal-hack-header">
            <h3><i className="fas fa-trophy"></i> Hackathon Overview</h3>
            <button className="btn-purple" onClick={() => navigate('/hackathons')}>
              <i className="fas fa-external-link-alt"></i> Manage Hackathons
            </button>
          </div>

          <div className="portal-hack-stats">
            <div className="portal-stat-mini">
              <i className="fas fa-calendar-check"></i>
              <div>
                <strong>{hackathons.length}</strong>
                <span>Total Events</span>
              </div>
            </div>
            <div className="portal-stat-mini">
              <i className="fas fa-bolt"></i>
              <div>
                <strong>{hackathons.filter(h => h.status === 'active').length}</strong>
                <span>Active</span>
              </div>
            </div>
            <div className="portal-stat-mini">
              <i className="fas fa-users"></i>
              <div>
                <strong>{totalRegs}</strong>
                <span>Participants</span>
              </div>
            </div>
            <div className="portal-stat-mini">
              <i className="fas fa-code"></i>
              <div>
                <strong>{myHackathons.length}</strong>
                <span>Created by You</span>
              </div>
            </div>
          </div>

          <div className="portal-hack-list">
            {hackathons.slice(0, 5).map(h => {
              const count = getRegCount(h.id);
              const pct = h.max_participants ? Math.round((count / h.max_participants) * 100) : 0;
              return (
                <div className="portal-hack-item" key={h.id} onClick={() => navigate('/hackathons')}>
                  <div className="portal-hack-item-left">
                    <div className={`portal-hack-status ${h.status}`}>
                      <i className={`fas ${h.status === 'active' ? 'fa-bolt' : h.status === 'completed' ? 'fa-check' : 'fa-clock'}`}></i>
                    </div>
                    <div>
                      <h4>{h.title}</h4>
                      <span>{h.date} • {h.location || 'Online'}</span>
                    </div>
                  </div>
                  <div className="portal-hack-item-right">
                    <div className="portal-hack-item-count">
                      <strong>{count}</strong> / {h.max_participants || '∞'}
                    </div>
                    <div className="hack-fill-bar-sm">
                      <div className="hack-fill-bar-inner" style={{ width: `${Math.min(100, pct)}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
            {hackathons.length === 0 && (
              <div className="portal-hack-empty">
                <p>No hackathons yet. <span onClick={() => navigate('/hackathons')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>Create one →</span></p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
