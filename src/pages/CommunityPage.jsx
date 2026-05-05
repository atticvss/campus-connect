import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/ui/Toast';

export default function CommunityPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [friendMap, setFriendMap] = useState({});
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: p }, { data: f }, { data: t }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, department, year, skills, bio, role').order('created_at', { ascending: false }),
      supabase.from('friendships').select('requester_id, receiver_id, status').or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`),
      supabase.from('teams').select('*, team_members(id)').order('created_at', { ascending: false }),
    ]);
    setProfiles((p || []).filter(x => x.id !== user.id));
    setTeams(t || []);
    const map = {};
    (f || []).forEach(fr => { const other = fr.requester_id === user.id ? fr.receiver_id : fr.requester_id; map[other] = fr.status; });
    setFriendMap(map);
  }

  async function sendRequest(receiverId) {
    const { error } = await supabase.from('friendships').insert({ requester_id: user.id, receiver_id: receiverId });
    if (error) { showToast(error.message); return; }
    showToast('Friend request sent!');
    load();
  }

  const q = query.toLowerCase();
  const filteredPeople = profiles.filter(p => !q || `${p.full_name} ${p.bio} ${(p.skills || []).join(' ')}`.toLowerCase().includes(q));
  const filteredTeams = teams.filter(t => !q || `${t.name} ${t.description}`.toLowerCase().includes(q));

  return (
    <>
      <h2 style={{ marginBottom: '1.2rem', fontSize: '1.3rem', fontWeight: 700 }}><i className="fas fa-compass"></i> Community Discover</h2>
      <div className="community-toolbar">
        <div className="community-search">
          <i className="fas fa-search" style={{ color: 'var(--gray-400)' }}></i>
          <input type="text" placeholder="Search people, skills, teams..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="community-tabs">
          {['all', 'people', 'teams'].map(t => (
            <button key={t} className={`community-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>
      <div className="community-feed">
        {tab !== 'teams' && filteredPeople.map(p => {
          const initials = (p.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          const skills = Array.isArray(p.skills) ? p.skills : [];
          const fStatus = friendMap[p.id];
          return (
            <div className="community-card" key={p.id}>
              <div className="community-head">
                <div className="community-avatar">{initials}</div>
                <div>
                  <div className="community-title">{p.full_name || 'Unknown'}</div>
                  <div className="community-sub">{p.role || 'student'} • {p.department || ''}</div>
                </div>
              </div>
              <div className="community-sub" style={{ marginTop: '0.4rem' }}>{p.bio || 'No bio added yet.'}</div>
              <div className="community-tags">{skills.map((s, i) => <span className="community-tag" key={i}>{s}</span>)}</div>
              <div className="community-actions">
                <button className="btn-link" onClick={() => showToast(`Profile: ${p.full_name}`)}><i className="fas fa-user"></i> View</button>
                {fStatus === 'accepted' ? <button className="btn-link" disabled><i className="fas fa-user-check"></i> Friends</button>
                  : fStatus === 'pending' ? <button className="btn-link" disabled><i className="fas fa-clock"></i> Pending</button>
                  : <button className="btn-link" onClick={() => sendRequest(p.id)}><i className="fas fa-user-plus"></i> Add Friend</button>}
              </div>
            </div>
          );
        })}
        {tab !== 'people' && filteredTeams.map(t => (
          <div className="community-card" key={`t-${t.id}`}>
            <div className="community-head">
              <div className="community-avatar"><i className="fas fa-users"></i></div>
              <div>
                <div className="community-title">{t.name}</div>
                <div className="community-sub">{t.team_members?.length || 0} members</div>
              </div>
            </div>
            <div className="community-sub" style={{ marginTop: '0.4rem' }}>{t.description}</div>
          </div>
        ))}
        {tab === 'people' && filteredPeople.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>No people found</div>}
        {tab === 'teams' && filteredTeams.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>No teams found</div>}
      </div>
    </>
  );
}
