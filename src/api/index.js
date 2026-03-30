import axios from 'axios';
import { logger } from '../utils/logger';

const BASE_URL = 'https://dev.natureland.hipster-virtual.com/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spa_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    logger.api('REQUEST', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    logger.error('REQUEST_ERROR', error);
    return Promise.reject(error);
  }
);

// Response interceptor – normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Unknown error';
    logger.error('API_ERROR', { status, message, url: error.config?.url });

    // Only redirect if NOT demo token
    const token = localStorage.getItem('spa_token') || '';
    if (status === 401 && !token.startsWith('demo-token')) {
      localStorage.removeItem('spa_token');
      window.location.href = '/';
    }

    return Promise.reject({
      status,
      message,
      isTimeout: error.code === 'ECONNABORTED',
      isNetwork: !error.response,
    });
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password, key_pass) =>
    apiClient.post('/login', { email, password, key_pass }),
  logout: () => apiClient.post('/logout'),
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  list: (params = {}) => apiClient.get('/bookings', { params }),
  create: (data) => apiClient.post('/bookings/create', data),
  update: (id, data) => apiClient.put(`/bookings/${id}`, data),
  cancel: (data) => apiClient.post('/bookings/item/cancel', data),
  destroy: (id) => apiClient.delete(`/bookings/destroy/${id}`),
  detail: (id) => apiClient.get(`/bookings/${id}`),
};

// ─── Therapists ───────────────────────────────────────────────────────────────
export const therapistsAPI = {
  list: (params = {}) => apiClient.get('/therapists', { params }),
};

// ─── Services ────────────────────────────────────────────────────────────────
export const servicesAPI = {
  list: (params = {}) => apiClient.get('/services', { params }),
};

// ─── Rooms ───────────────────────────────────────────────────────────────────
export const roomsAPI = {
  list: (params = {}) => apiClient.get('/rooms', { params }),
};

// ─── Clients ─────────────────────────────────────────────────────────────────
export const clientsAPI = {
  search: (query) => apiClient.get('/clients', { params: { search: query } }),
  create: (data) => apiClient.post('/clients', data),
};

// ─── Outlets ─────────────────────────────────────────────────────────────────
export const outletsAPI = {
  list: () => apiClient.get('/outlets'),
};
