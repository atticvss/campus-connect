import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('All fields required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const result = await signUp(email, password);
      if (result?.session) navigate('/profile-setup');
      else { setError('Signup successful! Check your email to verify, then sign in.'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="view active" id="view-signup">
      <div className="signup-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--gray-600)', letterSpacing: '.1em', fontWeight: 600 }}>CAMPUS CONNECT</div>
        <div className="signup-title">Create Your Account</div>
        <div className="signup-sub">Join the campus community</div>
        {error && <div className="error-msg" style={{ display: 'block' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field-light"><input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="field-light"><input type="password" placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <div className="field-light"><input type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
          <button className={`btn-next ${loading ? 'loading' : ''}`} type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="login-links" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
          <span className="signup-link">Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Sign In</Link></span>
        </div>
      </div>
    </div>
  );
}
