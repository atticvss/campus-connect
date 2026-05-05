import { showToast } from '../components/ui/Toast';

export default function SettingsPage() {
  return (
    <>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 700 }}><i className="fas fa-cog"></i> Preferences</h2>
      <div className="profile-section" style={{ maxWidth: 600 }}>
        <h3><i className="fas fa-bell"></i> Notification Preferences</h3>
        <div className="category-item"><span className="category-name">Email Notifications</span><div className="toggle" onClick={e => e.target.classList.toggle('off')}><i className="fas fa-check"></i></div></div>
        <div className="category-item"><span className="category-name">Push Notifications</span><div className="toggle" onClick={e => e.target.classList.toggle('off')}><i className="fas fa-check"></i></div></div>
        <div className="category-item"><span className="category-name">Team Updates</span><div className="toggle" onClick={e => e.target.classList.toggle('off')}><i className="fas fa-check"></i></div></div>
        <div className="category-item"><span className="category-name">Community Messages</span><div className="toggle" onClick={e => e.target.classList.toggle('off')}><i className="fas fa-check"></i></div></div>
        <button className="btn-primary" style={{ marginTop: '1.5rem', maxWidth: 200 }} onClick={() => showToast('Preferences saved!')}>Save Preferences</button>
      </div>
    </>
  );
}
