// This build runs inside the native Android app (not served from your nginx
// origin), so it needs the full production URL rather than a relative path.
// If your domain/tunnel ever changes, update this one line and rebuild.
const API_BASE = 'https://dragonmind.domeqserver001.space/api';

const Api = {
  token: null,

  setToken(token) {
    this.token = token;
  },

  async request(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new Error('Could not reach the server. Is the backend running?');
    }

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      // no JSON body (e.g. 204) - fine
    }

    if (!res.ok) {
      throw new Error((data && data.error) || `Request failed (${res.status})`);
    }
    return data;
  },

  // ---- auth ----
  signup(email, password) {
    return this.request('/auth/signup', { method: 'POST', body: { email, password } });
  },
  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: { email, password } });
  },

  // ---- folders ----
  getFolders() {
    return this.request('/folders');
  },
  createFolder(name) {
    return this.request('/folders', { method: 'POST', body: { name } });
  },
  renameFolder(id, name) {
    return this.request(`/folders/${id}`, { method: 'PATCH', body: { name } });
  },
  deleteFolder(id) {
    return this.request(`/folders/${id}`, { method: 'DELETE' });
  },

  // ---- tasks ----
  getTasks(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/tasks${qs ? `?${qs}` : ''}`);
  },
  createTask(folder_id, title, description) {
    return this.request('/tasks', { method: 'POST', body: { folder_id, title, description } });
  },
  updateTask(id, fields) {
    return this.request(`/tasks/${id}`, { method: 'PATCH', body: fields });
  },
  setTaskStatus(id, status) {
    return this.request(`/tasks/${id}/status`, { method: 'PATCH', body: { status } });
  },
  deleteTaskForever(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  },
};
