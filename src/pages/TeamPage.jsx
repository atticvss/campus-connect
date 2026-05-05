import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/ui/Toast';

export default function TeamPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [myTeamIds, setMyTeamIds] = useState(new Set());
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: t }, { data: mt }] = await Promise.all([
      supabase.from('teams').select('*, team_members(id, user_id)').order('created_at', { ascending: false }),
      supabase.from('team_members').select('team_id').eq('user_id', user.id),
    ]);
    setTeams(t || []);
    setMyTeamIds(new Set((mt || []).map(x => x.team_id)));
  }

  async function createTeam(e) {
    e.preventDefault();
    if (!teamName.trim() || !teamDesc.trim()) { showToast('Enter name and description'); return; }
    const { data, error } = await supabase.from('teams').insert({ name: teamName, description: teamDesc, tags: [], created_by: user.id }).select().single();
    if (error) { showToast(error.message); return; }
    await supabase.from('team_members').upsert({ user_id: user.id, team_id: data.id }, { onConflict: 'user_id,team_id' });
    setTeamName(''); setTeamDesc('');
    await load();
    loadMembers(data.id, data.name);
    showToast('Team created!');
  }

  async function toggleJoin(id) {
    if (myTeamIds.has(id)) {
      await supabase.from('team_members').delete().eq('user_id', user.id).eq('team_id', id);
      showToast('Left team.');
    } else {
      await supabase.from('team_members').upsert({ user_id: user.id, team_id: id }, { onConflict: 'user_id,team_id' });
      showToast('Joined team!');
    }
    load();
  }

  async function loadMembers(id, name) {
    setSelectedTeam(name);
    const { data } = await supabase.from('team_members').select('user_id, profiles(full_name, department, role)').eq('team_id', id).order('joined_at', { ascending: true });
    setMembers(data || []);
  }

  return (
    <>
      <div className="team-layout">
        <div className="create-team-card">
          <h2><i className="fas fa-plus-circle"></i> Create New Team</h2>
          <form onSubmit={createTeam}>
            <input className="team-input" placeholder="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} />
            <textarea className="team-input" placeholder="Describe your team's goals..." rows="3" value={teamDesc} onChange={e => setTeamDesc(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }}></textarea>
            <button className="btn-primary" style={{ borderRadius: 10 }} type="submit"><i className="fas fa-rocket"></i> Create Team</button>
          </form>
        </div>
        <div className="join-team-card">
          <h2><i className="fas fa-handshake"></i> Join Existing Teams</h2>
          <div className="club-list">
            {teams.length === 0 && <div className="club-list-item"><h4>No teams yet</h4><div className="club-list-meta"><span>Create a team to get started.</span></div></div>}
            {teams.map(t => {
              const isJoined = myTeamIds.has(t.id);
              const count = t.team_members?.length || 0;
              return (
                <div className="club-list-item" key={t.id}>
                  <h4>{t.name}</h4>
                  <div className="club-list-meta"><span>{t.description}</span><span>{count} members</span></div>
                  <div style={{ marginTop: '0.7rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-link" onClick={() => toggleJoin(t.id)}>
                      <i className={`fas ${isJoined ? 'fa-check-circle' : 'fa-plus-circle'}`}></i> {isJoined ? 'Joined' : 'Join'}
                    </button>
                    {isJoined && <button className="btn-link" onClick={() => toggleJoin(t.id)}><i className="fas fa-times-circle"></i> Leave</button>}
                    <button className="btn-link" onClick={() => loadMembers(t.id, t.name)}><i className="fas fa-users"></i> View Members</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="team-members-section">
        <h2><i className="fas fa-users"></i> {selectedTeam ? `Members of ${selectedTeam}` : 'Team Members'}</h2>
        <div className="members-grid">
          {!selectedTeam && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>Select a team to view members</div>}
          {members.map((m, i) => {
            const p = m.profiles || {};
            const initials = (p.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const role = p.role === 'faculty' ? 'Faculty' : p.role === 'club_admin' ? 'Club Admin' : 'Student';
            return (
              <div className="member-card" key={i}>
                <div className="member-avatar">{initials}</div>
                <div className="member-name">{p.full_name || 'Unknown'}</div>
                <div className="member-role">{role} • {p.department || ''}</div>
              </div>
            );
          })}
          {selectedTeam && members.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>No members found</div>}
        </div>
      </div>
    </>
  );
}
