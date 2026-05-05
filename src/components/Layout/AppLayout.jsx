import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/': 'Dashboard',
  '/posts': 'Posts',
  '/hackathons': 'Events',
  '/projects': 'Projects',
  '/clubs': 'Clubs',
  '/club-portal': 'Club Portal',
  '/notifications': 'Notifications',
  '/community': 'Community',
  '/profile': 'Profile',
  '/team': 'Team',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Campus Connect';

  return (
    <div className="view active" id="view-app">
      <Sidebar />
      <div className="app-content">
        <Topbar title={title} />
        <div className="page active">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
