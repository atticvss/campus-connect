import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { profile } = useAuth();
  if (!profile) return <div>Loading profile...</div>;

  const initials = (profile.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const role = profile.role === 'faculty' ? 'Faculty' : profile.role === 'club_admin' ? 'Club Admin' : 'Student';

  return (
    <div className="profile-layout">
      <div className="profile-left">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-name">{profile.full_name}</div>
          <div className="profile-sub">{role} • {profile.department || ''}</div>
          {profile.bio && <div className="profile-bio">{profile.bio}</div>}
          <div className="profile-links-row">
            {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn-link"><i className="fab fa-linkedin"></i> LinkedIn</a>}
            {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="btn-link"><i className="fab fa-github"></i> GitHub</a>}
          </div>
        </div>
      </div>
      <div className="profile-right">
        <div className="profile-section">
          <h3><i className="fas fa-info-circle"></i> Personal Info</h3>
          <div className="profile-meta-grid">
            <div className="profile-meta-item"><span className="profile-meta-label">Registration</span><span className="profile-meta-value">{profile.registration_number}</span></div>
            <div className="profile-meta-item"><span className="profile-meta-label">Department</span><span className="profile-meta-value">{profile.department || 'Not set'}</span></div>
            <div className="profile-meta-item"><span className="profile-meta-label">Year</span><span className="profile-meta-value">{profile.year || 'Not set'}</span></div>
            <div className="profile-meta-item"><span className="profile-meta-label">Phone</span><span className="profile-meta-value">{profile.phone || 'Not set'}</span></div>
            <div className="profile-meta-item"><span className="profile-meta-label">DOB</span><span className="profile-meta-value">{profile.dob || 'Not set'}</span></div>
            <div className="profile-meta-item"><span className="profile-meta-label">Role</span><span className="profile-meta-value">{role}</span></div>
          </div>
        </div>
        {skills.length > 0 && (
          <div className="profile-section">
            <h3><i className="fas fa-code"></i> Skills</h3>
            <div className="skill-tags">{skills.map((s, i) => <span className="skill-tag" key={i}>{s}</span>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
