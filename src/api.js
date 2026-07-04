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

async function request(path, { method = 'GET', body, adminToken } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const tokenHeader = adminToken !== undefined ? adminToken : getToken();
  if (tokenHeader) headers['X-Admin-Token'] = tokenHeader;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const adminApi = {
  adminStatus: () => request('/api/admin/ping'),
  login: async (token) => {
    const trimmed = String(token || '').trim();
    const res = await fetch(`${BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  },
  stats: () => request('/api/admin/stats'),
  // Users
  users: (page = 1, search = '') => request(`/api/admin/users?page=${page}&limit=50&search=${encodeURIComponent(search)}`),
  // Progress
  progress: (page = 1, userId = '') => request(`/api/admin/progress?page=${page}&limit=50${userId ? `&user_id=${userId}` : ''}`),
  deleteProgress: (id) => request(`/api/admin/progress/${id}`, { method: 'DELETE' }),
  // Questions
  questions: (page = 1, status = '') => request(`/api/admin/questions?page=${page}&limit=50${status ? `&status=${status}` : ''}`),
  updateQuestion: (id, status, adminResponse) => request(`/api/admin/questions/${id}`, {
    method: 'PUT',
    body: {
      ...(status !== undefined ? { status } : {}),
      ...(adminResponse !== undefined ? { admin_response: adminResponse } : {}),
    },
  }),
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
  // Webinars
  webinars: ({ page = 1, status = '', upcoming = false, limit = 50 } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (status) params.set('status', status);
    if (upcoming) params.set('upcoming', '1');
    return request(`/api/admin/webinars?${params.toString()}`);
  },
  createWebinar: (data) => request('/api/admin/webinars', { method: 'POST', body: data }),
  updateWebinar: (id, data) => request(`/api/admin/webinars/${id}`, { method: 'PUT', body: data }),
  deleteWebinar: (id) => request(`/api/admin/webinars/${id}`, { method: 'DELETE' }),
  // Bug reports
  bugReports: (page = 1, limit = 50) => request(`/api/admin/bug-reports?page=${page}&limit=${limit}`),
  updateBugReport: (id, status) => request(`/api/admin/bug-reports/${id}`, { method: 'PUT', body: { status } }),
  // CMS Video Sections
  videoSections: () => request('/api/admin/video-sections'),
  createVideoSection: (data) => request('/api/admin/video-sections', { method: 'POST', body: data }),
  updateVideoSection: (id, data) => request(`/api/admin/video-sections/${id}`, { method: 'PUT', body: data }),
  deleteVideoSection: (id) => request(`/api/admin/video-sections/${id}`, { method: 'DELETE' }),
  // CMS Video Subsections
  videoSubsections: (sectionId) => request(`/api/admin/video-subsections${sectionId ? `?section_id=${sectionId}` : ''}`),
  createVideoSubsection: (data) => request('/api/admin/video-subsections', { method: 'POST', body: data }),
  updateVideoSubsection: (id, data) => request(`/api/admin/video-subsections/${id}`, { method: 'PUT', body: data }),
  deleteVideoSubsection: (id) => request(`/api/admin/video-subsections/${id}`, { method: 'DELETE' }),
  // CMS Videos
  videos: (subsectionId) => request(`/api/admin/videos${subsectionId ? `?subsection_id=${subsectionId}` : ''}`),
  createVideo: (data) => request('/api/admin/videos', { method: 'POST', body: data }),
  updateVideo: (id, data) => request(`/api/admin/videos/${id}`, { method: 'PUT', body: data }),
  deleteVideo: (id) => request(`/api/admin/videos/${id}`, { method: 'DELETE' }),
  videoStatus: (id) => request(`/api/admin/videos/${id}/status`),
  uploadVideo: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${BASE}/api/admin/videos/${id}/upload`, {
      method: 'POST',
      headers: { 'X-Admin-Token': getToken() },
      body: formData,
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      return data;
    });
  },
  // CMS Challenge Levels
  challengeLevels: () => request('/api/admin/challenge-levels'),
  createChallengeLevel: (data) => request('/api/admin/challenge-levels', { method: 'POST', body: data }),
  updateChallengeLevel: (id, data) => request(`/api/admin/challenge-levels/${id}`, { method: 'PUT', body: data }),
  deleteChallengeLevel: (id) => request(`/api/admin/challenge-levels/${id}`, { method: 'DELETE' }),
  // CMS Challenges
  challenges: (levelId) => request(`/api/admin/challenges${levelId ? `?level_id=${levelId}` : ''}`),
  createChallenge: (data) => request('/api/admin/challenges', { method: 'POST', body: data }),
  updateChallenge: (id, data) => request(`/api/admin/challenges/${id}`, { method: 'PUT', body: data }),
  deleteChallenge: (id) => request(`/api/admin/challenges/${id}`, { method: 'DELETE' }),
  // Announcements
  sendAnnouncement: (data) => request('/api/admin/announcements', { method: 'POST', body: data }),
};
