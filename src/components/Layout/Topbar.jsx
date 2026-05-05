import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="topbar">
      <div className="topbar-title">{title || 'Dashboard'}</div>
      <div className="search-bar">
        <i className="fas fa-search"></i>
        <input type="text" placeholder="Search hackathons, projects..." />
      </div>
      <div className="topbar-actions">
        <div className="icon-btn badge" onClick={() => navigate('/notifications')} title="Notifications">
          <i className="fas fa-bell"></i>
        </div>
        <div className="icon-btn" title="Calendar">
          <i className="fas fa-calendar-alt"></i>
        </div>
        <div className="avatar-sm" onClick={() => navigate('/profile')} title="Profile">{initials}</div>
      </div>
    </div>
  );
}
