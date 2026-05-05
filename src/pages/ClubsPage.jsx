import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/ui/Toast';

export default function ClubsPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [joined, setJoined] = useState(new Set());

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from('clubs').select('*').order('created_at', { ascending: false }),
      supabase.from('memberships').select('club_id').eq('user_id', user.id),
    ]);
    setClubs(c || []);
    setJoined(new Set((m || []).map(x => x.club_id)));
  }

  async function toggle(id) {
    if (joined.has(id)) {
      await supabase.from('memberships').delete().eq('user_id', user.id).eq('club_id', id);
      showToast('Left club.');
    } else {
      await supabase.from('memberships').upsert({ user_id: user.id, club_id: id }, { onConflict: 'user_id,club_id' });
      showToast('Joined club!');
    }
    load();
  }

  return (
    <>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.3rem', fontWeight: 700 }}><i className="fas fa-users"></i> Campus Clubs & Communities</h2>
      <div id="clubs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {clubs.length === 0 && <div className="dash-card"><h3>No clubs yet</h3><p>Club admins can create clubs from the Club Portal.</p></div>}
        {clubs.map(club => {
          const isJoined = joined.has(club.id);
          return (
            <div className="dash-card" key={club.id}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}><i className="fas fa-users"></i></div>
              <h3>{club.name}</h3>
              <p>{club.description}</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn-purple" style={{ fontSize: '0.8rem', padding: '0.6rem 1rem', minWidth: 120 }} onClick={() => toggle(club.id)}>
                  <i className={`fas ${isJoined ? 'fa-check-circle' : 'fa-plus-circle'}`}></i> {isJoined ? 'Joined' : 'Join Club'}
                </button>
                {isJoined && <button className="btn-link" onClick={() => toggle(club.id)}><i className="fas fa-times-circle"></i> Leave</button>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
