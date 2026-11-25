const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${API_URL}/api/v1`;

export const getStoredToken = () => localStorage.getItem('labelloop_token');
export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('labelloop_token', token);
  } else {
    localStorage.removeItem('labelloop_token');
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('labelloop_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('labelloop_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('labelloop_user');
  }
};

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...options.headers
  };

  // Only set application/json if not uploading FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Auth token invalid or expired
    setStoredToken(null);
    setStoredUser(null);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || 'Request failed');
    }
    return json;
  } else {
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Request failed');
    }
    return response;
  }
}

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setStoredToken(res.data.token);
    setStoredUser(res.data.user);
    return res.data;
  },

  register: async (data) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setStoredToken(res.data.token);
    setStoredUser(res.data.user);
    return res.data;
  },

  getMe: async () => {
    const res = await request('/auth/me');
    setStoredUser(res.data.user);
    return res.data.user;
  },

  logout: () => {
    setStoredToken(null);
    setStoredUser(null);
  },

  // Projects
  getProjects: async (status) => {
    const query = status ? `?status=${status}` : '';
    const res = await request(`/projects${query}`);
    return res.data.projects;
  },

  getProject: async (id) => {
    const res = await request(`/projects/${id}`);
    return res.data.project;
  },

  createProject: async (data) => {
    const res = await request('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data.project;
  },

  updateProject: async (id, data) => {
    const res = await request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data.project;
  },

  updateProjectStatus: async (id, status) => {
    const res = await request(`/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return res.data.project;
  },

  triggerAIPrelabel: async (id) => {
    const res = await request(`/projects/${id}/ai-prelabel`, {
      method: 'POST'
    });
    return res.data;
  },

  deleteProject: async (id) => {
    return request(`/projects/${id}`, {
      method: 'DELETE'
    });
  },

  getProjectStats: async (id) => {
    const res = await request(`/projects/${id}/stats`);
    return res.data.stats;
  },

  // Tasks & Annotations
  getNextTask: async (projectId) => {
    const res = await request(`/projects/${projectId}/tasks/next`);
    return res.data.task;
  },

  skipTask: async (taskId) => {
    const res = await request(`/tasks/${taskId}/skip`, {
      method: 'POST'
    });
    return res.data.task;
  },

  submitAnnotation: async (taskId, data) => {
    const res = await request(`/tasks/${taskId}/annotate`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  uploadCSV: async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await request(`/projects/${projectId}/tasks/upload`, {
      method: 'POST',
      body: formData
    });
    return res.data;
  },

  createTasksBatch: async (projectId, tasks) => {
    const res = await request(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ tasks })
    });
    return res.data;
  },

  getTasks: async (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await request(`/projects/${projectId}/tasks?${query}`);
    return res.data;
  },

  // Review Queue
  getReviewQueue: async (projectId) => {
    const res = await request(`/projects/${projectId}/tasks/review-queue`);
    return res.data.tasks;
  },

  reviewTask: async (taskId, data) => {
    const res = await request(`/tasks/${taskId}/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  // Time Tracking
  getMyTodayLog: async () => {
    const res = await request('/timelog/today');
    return res.data.log;
  },

  getTimelogHistory: async (start, end, userId) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    if (userId) params.set('userId', userId);
    const res = await request(`/timelog/history?${params}`);
    return res.data;
  },

  getUserDayLog: async (userId, date) => {
    const res = await request(`/timelog/user/${userId}/${date}`);
    return res.data.log;
  },

  exportDataset: async (projectId, format = 'json', completedOnly = true) => {
    const token = getStoredToken();
    const url = `${API_BASE}/projects/${projectId}/export?format=${format}&completedOnly=${completedOnly}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Export request failed');
    }

    if (format === 'csv') {
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `project_${projectId}_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    } else {
      const json = await response.json();
      const blob = new Blob([JSON.stringify(json.data, null, 2)], {
        type: 'application/json'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `project_${projectId}_export.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return json.data;
    }
  }
};
