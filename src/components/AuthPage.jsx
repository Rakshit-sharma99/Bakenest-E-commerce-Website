import { useState } from 'react';
import bgImage from '../assets/images/abcdefg.png';
import './AuthPage.css';
import { api, authStore } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';

const ENABLE_GOOGLE_LOGIN = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

/* ── tiny icon helpers ── */
const IconEmail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 7L2 7" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconEye = ({ open }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function InputField({ id, label, type = 'text', icon: Icon, value, onChange, showToggle, onToggle, showPw }) {
  return (
    <div className="authField">
      <label htmlFor={id} className="authFieldLabel">{label}</label>
      <div className="authInputWrap">
        <span className="authInputIcon"><Icon /></span>
        <input
          id={id}
          type={showToggle ? (showPw ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={label}
          className="authInput"
          required
        />
        {showToggle && (
          <button type="button" className="eyeToggle" onClick={onToggle}><IconEye open={showPw} /></button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage({ onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = await api.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(form),
      });

      authStore.saveSession(payload);
      onAuthSuccess(payload.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const payload = await api.request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      authStore.saveSession(payload);
      onAuthSuccess(payload.user);
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="authOverlay" aria-hidden="true" />
      <button className="authClose" onClick={onClose}>← Back</button>
      
      <div className="authCardWrap">
        <div className={`authCard ${mode}`}>
          <div className="authTabs">
            <button className={`authTab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Log In</button>
            <button className={`authTab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign Up</button>
          </div>

          <div className="authCardHeader">
            <h1 className="authTitle">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="authSubtitle">{mode === 'login' ? 'Login to your account' : 'Join BakeHaus today'}</p>
          </div>

          <form className="authForm" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <InputField label="Full Name" icon={IconUser} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            )}
            <InputField label="Email" type="email" icon={IconEmail} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <InputField label="Password" icon={IconLock} value={form.password} onChange={e => setForm({...form, password: e.target.value})} showToggle showPw={showPw} onToggle={() => setShowPw(!showPw)} />

            {error && <div className="authError" role="alert">{error}</div>}

            <button type="submit" className="authSubmit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          {ENABLE_GOOGLE_LOGIN && (
            <>
              <div className="authDivider">
                <span /> <em>OR</em> <span />
              </div>

              <div className="authSocial">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed')}
                  theme="outline"
                  size="large"
                  shape="pill"
                  logo_alignment="center"
                  text="continue_with"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
