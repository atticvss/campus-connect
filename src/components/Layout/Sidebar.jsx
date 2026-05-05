import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: 'fa-th', label: 'Dashboard', end: true },
  { to: '/posts', icon: 'fa-newspaper', label: 'Posts' },
  { to: '/hackathons', icon: 'fa-calendar-check', label: 'Events' },
  { to: '/projects', icon: 'fa-folder', label: 'Projects' },
  { to: '/clubs', icon: 'fa-users', label: 'Clubs' },
  { to: '/club-portal', icon: 'fa-building', label: 'Club Portal' },
  { to: '/notifications', icon: 'fa-bell', label: 'Notifications' },
  { to: '/community', icon: 'fa-compass', label: 'Community' },
];

const bottomItems = [
  { to: '/profile', icon: 'fa-user', label: 'Profile' },
  { to: '/team', icon: 'fa-handshake', label: 'Team' },
  { to: '/settings', icon: 'fa-cog', label: 'Settings' },
];

export default function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = (profile?.full_name || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <i className="fas fa-graduation-cap"></i>
        <span>Campus Connect</span>
      </div>
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="user-name">{profile?.full_name || 'User'}</div>
        <div className="user-email">{user?.email || ''}</div>
      </div>
      <nav>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        {bottomItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div className="nav-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Sign Out</span>
        </div>
      </div>
    </aside>
  );
}
