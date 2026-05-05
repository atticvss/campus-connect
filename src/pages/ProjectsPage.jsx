import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/ui/Toast';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [registered, setRegistered] = useState(new Set());

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('registrations').select('project_id').eq('user_id', user.id),
    ]);
    setProjects(p || []);
    setRegistered(new Set((r || []).map(x => x.project_id).filter(Boolean)));
  }

  async function toggleReg(id) {
    if (registered.has(id)) {
      await supabase.from('registrations').delete().eq('user_id', user.id).eq('project_id', id);
      showToast('Left project.');
    } else {
      await supabase.from('registrations').insert({ user_id: user.id, project_id: id });
      showToast('Joined project!');
    }
    load();
  }

  return (
    <>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.3rem', fontWeight: 700 }}><i className="fas fa-folder-open"></i> All Projects</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {projects.length === 0 && <div className="dash-card"><h3>No projects yet</h3><p>Faculty can create projects from Club Portal.</p></div>}
        {projects.map(p => {
          const isReg = registered.has(p.id);
          return (
            <div className="dash-card" key={p.id}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 10, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'white', fontWeight: 700 }}>Project</div>
              <h3><i className="fas fa-folder-open"></i> {p.title}</h3>
              <p>{p.description}</p>
              <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn-join" style={{ minWidth: 120 }} onClick={() => toggleReg(p.id)}>
                  <i className={`fas ${isReg ? 'fa-check-circle' : 'fa-plus-circle'}`}></i> {isReg ? 'Joined' : 'Join Project'}
                </button>
                {isReg && <button className="btn-link" onClick={() => toggleReg(p.id)}><i className="fas fa-times-circle"></i> Leave</button>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
