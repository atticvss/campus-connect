import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ clubs: [], teams: [], registrations: [] });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('memberships').select('club_id, clubs(name)').eq('user_id', user.id),
      supabase.from('team_members').select('team_id, teams(name)').eq('user_id', user.id),
      supabase.from('registrations').select('project_id, hackathon_id, projects(title), hackathons(title)').eq('user_id', user.id),
    ]).then(([c, t, r]) => {
      setStats({ clubs: c.data || [], teams: t.data || [], registrations: r.data || [] });
    });
  }, [user]);

  const clubNames = stats.clubs.map(c => c.clubs?.name).filter(Boolean);
  const teamNames = stats.teams.map(t => t.teams?.name).filter(Boolean);
  const regNames = stats.registrations.map(r => r.projects?.title || r.hackathons?.title).filter(Boolean);

  return (
    <>
      <div className="dash-main">
        <div className="dash-main-left">
          <div className="dash-grid">
            <div className="dash-card" onClick={() => navigate('/hackathons')}>
              <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80" alt="Hackathon" />
              <h3>Active Hackathons</h3>
              <p>Join challenges and collaborate with teams to build innovative solutions</p>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '65%' }}></div></div>
              <div className="dash-card-meta"><span><i className="fas fa-fire"></i> Events</span><span>65%</span></div>
            </div>
            <div className="dash-card" onClick={() => navigate('/profile')}>
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" alt="Profile" />
              <div className="badge-tag"><i className="fas fa-user-edit"></i> Complete Profile</div>
              <h3>Your Profile</h3>
              <p>Showcase your skills, projects, and achievements</p>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '75%' }}></div></div>
              <div className="dash-card-meta"><span><i className="fas fa-check-circle"></i> 3/4 sections</span><span>75%</span></div>
            </div>
            <div className="dash-card" onClick={() => navigate('/clubs')}>
              <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&q=80" alt="Clubs" />
              <div className="badge-tag"><i className="fas fa-star"></i> Trending</div>
              <h3>Campus Clubs</h3>
              <p>Connect with like-minded students and explore communities</p>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '45%' }}></div></div>
              <div className="dash-card-meta"><span><i className="fas fa-users"></i> {clubNames.length} clubs</span><span>45%</span></div>
            </div>
            <div className="dash-card">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" alt="Achievements" />
              <h3>Your Achievements</h3>
              <p>Track your progress and earn badges for completing challenges</p>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '85%' }}></div></div>
              <div className="dash-card-meta"><span><i className="fas fa-medal"></i> 12 badges</span><span>Excellent</span></div>
            </div>
          </div>

          <div className="calendar-wrap" style={{ marginTop: '1.5rem' }}>
            <h3><i className="fas fa-database" style={{ marginRight: 8 }}></i> My Supabase Dashboard</h3>
            <div style={{ marginTop: '0.8rem' }}><strong>Joined Clubs:</strong> {clubNames.length ? clubNames.join(', ') : 'None yet'}</div>
            <div style={{ marginTop: '0.8rem' }}><strong>Projects/Hackathons:</strong> {regNames.length ? regNames.join(', ') : 'None yet'}</div>
            <div style={{ marginTop: '0.8rem' }}><strong>Joined Teams:</strong> {teamNames.length ? teamNames.join(', ') : 'None yet'}</div>
          </div>
        </div>

        <div className="dash-right">
          <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}><i className="fas fa-trophy" style={{ color: 'var(--accent)', marginRight: 8 }}></i> Current Focus</div>
          <div className="hackathon-card">
            <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80" alt="Hackathon" />
            <div className="hackathon-card-body">
              <h3>Web Dev Challenge 2025</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>28/50 Participants • <span style={{ color: 'var(--success)', fontWeight: 600 }}><i className="fas fa-check-circle"></i> Active</span></div>
            </div>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 1rem' }}><i className="fas fa-bell" style={{ color: 'var(--warning)', marginRight: 8 }}></i> Latest Update</div>
          <div className="notif-card" onClick={() => navigate('/notifications')}>
            <i className="fas fa-sparkles"></i>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>New hackathon posted!</div>
              <div style={{ fontSize: '0.8rem' }}>Tap to view and register</div>
            </div>
            <div className="notif-arrow"><i className="fas fa-arrow-right"></i></div>
          </div>
        </div>
      </div>
    </>
  );
}
