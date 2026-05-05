import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../components/ui/Toast';

export default function ProfileSetupPage() {
  const { user, upsertProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: '', dob: '', role: 'student', registration_number: '', phone: '', department: '', year: '', specialization: '', skills: [''], bio: '', linkedin: '', github: '' });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.dob || !form.registration_number || !form.department || !form.year) {
      showToast('Please fill all required fields.'); return;
    }
    setLoading(true);
    try {
      await upsertProfile({ id: user.id, ...form, skills: form.skills.filter(Boolean) });
      showToast('Profile created!');
      navigate('/');
    } catch (err) { showToast(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="view active" id="view-profile-setup">
      <div className="signup-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--gray-600)', letterSpacing: '.1em', fontWeight: 600 }}>CAMPUS CONNECT</div>
        <div className="signup-title">Create Your Profile</div>
        <div className="signup-sub">Set up your profile to continue</div>
        <form onSubmit={handleSubmit}>
          <div className="field-light"><input placeholder="Full Name *" value={form.full_name} onChange={e => set('full_name', e.target.value)} /></div>
          <div className="field-light"><input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} /></div>
          <div className="field-light">
            <select value={form.role} onChange={e => set('role', e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', width: '100%', color: 'var(--gray-900)' }}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="club_admin">Club Admin</option>
            </select>
          </div>
          <div className="field-light"><input placeholder="Registration Number *" value={form.registration_number} onChange={e => set('registration_number', e.target.value)} /></div>
          <div className="field-light"><input placeholder="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div className="field-light"><input placeholder="Department / Branch *" value={form.department} onChange={e => set('department', e.target.value)} /></div>
          <div className="field-light"><input placeholder="Year of Study *" value={form.year} onChange={e => set('year', e.target.value)} /></div>
          <div style={{ color: 'var(--gray-700)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>Your Skills</div>
          {form.skills.map((s, i) => (
            <div className="field-light" key={i}>
              <input placeholder="e.g. Python, React" value={s} onChange={e => { const arr = [...form.skills]; arr[i] = e.target.value; set('skills', arr); }} />
            </div>
          ))}
          <span className="add-skill" onClick={() => set('skills', [...form.skills, ''])}><i className="fas fa-plus" style={{ marginRight: 4 }}></i> Add more skills</span>
          <button className={`btn-next ${loading ? 'loading' : ''}`} type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Profile Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
