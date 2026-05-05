import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view active" id="view-login">
      <div className="login-wrap">
        <div className="login-logo"><i className="fas fa-graduation-cap"></i> Campus Connect</div>
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p>Sign in to access your campus network</p>
          {error && <div className="error-msg" style={{ display: 'flex', alignItems: 'center' }}><i className="fas fa-exclamation-circle" style={{ marginRight: 8 }}></i> {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button className={`btn-primary ${loading ? 'loading' : ''}`} type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          <div className="login-links">
            <span className="signup-link">New here? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create Account</Link></span>
          </div>
        </div>
      </div>
    </div>
  );
}
