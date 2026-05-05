import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashboardPage from './pages/DashboardPage';
import HackathonsPage from './pages/HackathonsPage';
import ProjectsPage from './pages/ProjectsPage';
import ClubsPage from './pages/ClubsPage';
import TeamPage from './pages/TeamPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PostsPage from './pages/PostsPage';
import ClubPortalPage from './pages/ClubPortalPage';
import NotificationsPage from './pages/NotificationsPage';
import Toast from './components/ui/Toast';

function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen"><i className="fas fa-spinner fa-spin"></i></div>;
  if (!user) return <Navigate to="/login" />;
  if (!profile) return <Navigate to="/profile-setup" />;
  return children;
}

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="loading-screen"><i className="fas fa-spinner fa-spin"></i> Loading...</div>;

  return (
    <>
      <Routes>
        <Route path="/login" element={user && profile ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/signup" element={user && profile ? <Navigate to="/" /> : <SignupPage />} />
        <Route path="/profile-setup" element={user && !profile ? <ProfileSetupPage /> : <Navigate to="/" />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="hackathons" element={<HackathonsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="clubs" element={<ClubsPage />} />
          <Route path="club-portal" element={<ClubPortalPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="posts" element={<PostsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
      <Toast />
    </>
  );
}
