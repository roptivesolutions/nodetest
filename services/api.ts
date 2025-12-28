import { storage } from './storage';

const BASE_URL = 'https://sms.ebinayah.com/attandance';

export const api = {
  // Shared state for the CSRF token
  getCsrfToken() {
    return storage.get<string | null>('csrf_token', null);
  },

  setCsrfToken(token: string | null) {
    storage.set('csrf_token', token);
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const csrfToken = this.getCsrfToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Automatically inject CSRF token for mutation requests
    // Using Pascal-Case for best compatibility across different server setups
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || '')) {
      (headers as any)['X-CSRF-Token'] = csrfToken;
    }

    try {
      const response = await fetch(`${BASE_URL}/${endpoint}`, {
        ...options,
        headers,
        // CRITICAL: Must include credentials to send/receive session cookies (PHPSESSID)
        credentials: 'include',
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        // Trigger event to logout user if session expired or cookie not sent
        window.dispatchEvent(new CustomEvent('attendify-unauthorized'));
      }

      if (!response.ok) {
        throw new Error(data.error || `System Error: ${response.status}`);
      }
      
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err; // Re-throw to be handled by the caller
      }
      if (err.message === 'Failed to fetch') {
        throw new Error('Network unreachable. Please check your connectivity.');
      }
      throw err;
    }
  },

  auth: {
    login: async (credentials: any) => {
      const res = await api.request('login.php', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      if (res.csrf_token) {
        api.setCsrfToken(res.csrf_token);
      }
      return res;
    },
    logout: async () => {
      try {
        await api.request('logout.php', { method: 'POST' });
      } finally {
        api.setCsrfToken(null);
      }
    }
  },

  attendance: {
    getLogs: (userId: string, role: string, signal?: AbortSignal) => 
      api.request(`attendance.php?user_id=${userId}&role=${role}`, { signal }),
    checkIn: (userId: string, data: any) => api.request('attendance.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'check_in', user_id: userId, ...data })
    }),
    checkOut: (userId: string, data: any) => api.request('attendance.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'check_out', user_id: userId, ...data })
    }),
  },

  leaves: {
    get: (userId: string, role: string, signal?: AbortSignal) => 
      api.request(`leaves.php?user_id=${userId}&role=${role}`, { signal }),
    submit: (data: any) => api.request('leaves.php', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateStatus: (id: string, status: string) => api.request('leaves.php', {
      method: 'PATCH',
      body: JSON.stringify({ id, status })
    }),
  },

  email: {
    send: (to: string, subject: string, body: string) => api.request('email.php', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body })
    }),
    getLogs: (signal?: AbortSignal) => api.request('email.php', { signal }),
  },

  settings: {
    get: (signal?: AbortSignal) => api.request('settings.php', { signal }),
    update: (key: string, value: string) => api.request('settings.php', {
      method: 'PATCH',
      body: JSON.stringify({ key, value })
    }),
  },

  policies: {
    get: (signal?: AbortSignal) => api.request('policies.php', { signal }),
    update: (data: any) => api.request('policies.php', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  },

  directory: {
    getEmployees: (signal?: AbortSignal) => api.request('directory.php?type=employees', { signal }),
    getDepartments: (signal?: AbortSignal) => api.request('directory.php?type=departments', { signal }),
    addEmployee: (data: any) => api.request('directory.php?type=employees', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateEmployee: (id: string, data: any) => api.request('directory.php?type=employees', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data })
    }),
    deleteEmployee: (id: string) => api.request(`directory.php?type=employees&id=${id}`, {
      method: 'DELETE'
    }),
    addDepartment: (name: string) => api.request('directory.php?type=departments', {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
    updateDepartment: (id: number, name: string) => api.request('directory.php?type=departments', {
      method: 'PUT',
      body: JSON.stringify({ id, name })
    }),
    deleteDepartment: (id: string) => api.request(`directory.php?type=departments&id=${id}`, {
      method: 'DELETE'
    }),
  },

  announcements: {
    get: (signal?: AbortSignal) => api.request('announcements.php', { signal }),
    post: (data: any) => api.request('announcements.php', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  },

  holidays: {
    get: (signal?: AbortSignal) => api.request('holidays.php', { signal }),
    post: (data: any) => api.request('holidays.php', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => api.request(`holidays.php?id=${id}`, {
      method: 'DELETE'
    }),
  },

  notifications: {
    get: (userId: string, signal?: AbortSignal) => api.request(`notifications.php?user_id=${userId}`, { signal }),
    post: (data: any) => api.request('notifications.php', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    markRead: (id: string) => api.request('notifications.php', {
      method: 'PATCH',
      body: JSON.stringify({ id })
    }),
    clear: (userId: string) => api.request(`notifications.php?user_id=${userId}`, {
      method: 'DELETE'
    }),
  },

  profile: {
    updatePassword: (data: any) => api.request('profile.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_password', ...data })
    }),
    updateAvatar: (userId: string, avatar: string) => api.request('profile.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_avatar', user_id: userId, avatar })
    }),
  }
};