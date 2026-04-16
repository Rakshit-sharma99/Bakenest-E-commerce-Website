import { useState } from 'react';
import { api, authStore } from '../../services/api';
import './AdminLogin.css';

export default function AdminLogin({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = await api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (payload.user?.role !== 'admin') {
        throw new Error('This account is not authorized for admin access.');
      }

      authStore.saveSession(payload);
      onSuccess(payload.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openPreviewMode = () => {
    const previewUser = {
      name: 'Admin Preview',
      email: 'preview@bakenest.local',
      role: 'admin',
    };

    authStore.savePreviewSession(previewUser);
    onSuccess(previewUser);
  };

  return (
    <div className="adminAuthWrap">
      <form className="adminAuthCard" onSubmit={handleSubmit}>
        <h1>Admin Dashboard Login</h1>
        <p>Secure access for BakeNest store management.</p>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>

        {error && <div className="adminError">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Authenticating...' : 'Enter Dashboard'}
        </button>

        <button type="button" className="previewBtn" onClick={openPreviewMode}>
          Open Dashboard (Preview Mode)
        </button>
      </form>
    </div>
  );
}
