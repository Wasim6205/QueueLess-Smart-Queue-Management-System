import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach Bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('queueless:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // If a protected route received 401, clear stored token
      if (url.includes('/admin') || url.includes('/auth/me')) {
        localStorage.removeItem('queueless:token');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper to format API errors consistently
export function getErrorMessage(error) {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || 'An unexpected error occurred. Please try again.';
}

export const authApi = {
  login: async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  me: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const servicesApi = {
  list: async () => {
    const res = await api.get('/services');
    return res.data;
  },
};

export const tokensApi = {
  book: async ({ customerName, phone, serviceId }) => {
    const res = await api.post('/tokens', { customerName, phone, serviceId });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/tokens/${id}`);
    return res.data;
  },
  cancel: async (id) => {
    const res = await api.patch(`/tokens/${id}/cancel`);
    return res.data;
  },
};

export const adminApi = {
  getQueue: async (serviceId) => {
    const res = await api.get(`/admin/queue/${serviceId}`);
    return res.data;
  },
  callNext: async (serviceId) => {
    const res = await api.post(`/admin/queue/${serviceId}/next`);
    return res.data;
  },
  addWalkin: async (serviceId, { customerName, phone }) => {
    const res = await api.post(`/admin/queue/${serviceId}/walkin`, { customerName, phone });
    return res.data;
  },
  setOpen: async (serviceId, isOpen) => {
    const res = await api.patch(`/admin/services/${serviceId}/open`, { isOpen });
    return res.data;
  },
  complete: async (tokenId) => {
    const res = await api.patch(`/admin/tokens/${tokenId}/complete`);
    return res.data;
  },
  skip: async (tokenId) => {
    const res = await api.patch(`/admin/tokens/${tokenId}/skip`);
    return res.data;
  },
  cancel: async (tokenId) => {
    const res = await api.patch(`/admin/tokens/${tokenId}/cancel`);
    return res.data;
  },
  resetQueue: async (serviceId) => {
    const res = await api.post(`/admin/queue/${serviceId}/reset`);
    return res.data;
  },
};

export default api;
