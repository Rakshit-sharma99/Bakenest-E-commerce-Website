const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getToken = () => localStorage.getItem('bakenest_token');

const withAuthHeaders = (headers = {}) => {
  const token = getToken();
  if (!token) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
};

export const api = {
  base: API_BASE,

  async request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: withAuthHeaders({
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE}/uploads/image`, {
      method: 'POST',
      headers: withAuthHeaders(),
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Image upload failed');
    return data;
  },
};

export const authStore = {
  saveSession(payload) {
    localStorage.setItem('bakenest_token', payload.token);
    localStorage.setItem('bakenest_user', JSON.stringify(payload.user));
  },
  clearSession() {
    localStorage.removeItem('bakenest_token');
    localStorage.removeItem('bakenest_user');
  },
  getUser() {
    const raw = localStorage.getItem('bakenest_user');
    return raw ? JSON.parse(raw) : null;
  },
};
