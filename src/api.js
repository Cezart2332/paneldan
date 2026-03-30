// In dev, use empty string so requests go through Vite's proxy (/api/...).
// In production, set VITE_API_URL to the real backend URL.
const BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('admin_token') || '';
}

export function setToken(token) {
  localStorage.setItem('admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('admin_token');
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': getToken() };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

export const adminApi = {
  login: (token) => request('/api/admin/login', { method: 'POST', body: { token } }),
  stats: () => request('/api/admin/stats'),
  // Users
  users: (page = 1, search = '') => request(`/api/admin/users?page=${page}&limit=50&search=${encodeURIComponent(search)}`),
  // Progress
  progress: (page = 1, userId = '') => request(`/api/admin/progress?page=${page}&limit=50${userId ? `&user_id=${userId}` : ''}`),
  deleteProgress: (id) => request(`/api/admin/progress/${id}`, { method: 'DELETE' }),
  // Questions
  questions: (page = 1, status = '') => request(`/api/admin/questions?page=${page}&limit=50${status ? `&status=${status}` : ''}`),
  updateQuestion: (id, status) => request(`/api/admin/questions/${id}`, { method: 'PUT', body: { status } }),
  // Meetings
  meetings: ({ page = 1, upcoming = false, limit = 50, from = '', to = '' } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (upcoming) params.set('upcoming', '1');
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request(`/api/admin/meetings?${params.toString()}`);
  },
  createMeeting: (data) => request('/api/admin/meetings', { method: 'POST', body: data }),
  updateMeeting: (id, data) => request(`/api/admin/meetings/${id}`, { method: 'PUT', body: data }),
  deleteMeeting: (id) => request(`/api/admin/meetings/${id}`, { method: 'DELETE' }),
  // Bug reports
  bugReports: (page = 1, limit = 50) => request(`/api/admin/bug-reports?page=${page}&limit=${limit}`),
  updateBugReport: (id, status) => request(`/api/admin/bug-reports/${id}`, { method: 'PUT', body: { status } }),
};
