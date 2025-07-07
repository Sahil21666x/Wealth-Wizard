import axios from 'axios';

//added api
const API_BASE_URL = import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
};

// Transactions API functions
export const transactionsAPI = {
  getAll: (params) => api.get('/api/transactions', { params }),
  create: (data) => api.post('/api/transactions', data),
  update: (id, data) => api.put(`/api/transactions/${id}`, data),
  delete: (id) => api.delete(`/api/transactions/${id}`),
  getCategories: () => api.get('/api/transactions/categories'),
};

// Goals API functions
export const goalsAPI = {
  getAll: () => api.get('/api/goals'),
  create: (data) => api.post('/api/goals', data),
  update: (id, data) => api.put(`/api/goals/${id}`, data),
  delete: (id) => api.delete(`/api/goals/${id}`),
  contribute: (id, amount) => api.post(`/api/goals/${id}/contribute`, { amount }),
};

// Insights API functions
export const insightsAPI = {
  getInsights: (period) => api.get('/api/insights', { params: { period } }),
  getPredictions: () => api.get('/api/insights/predictions'),
  getTips: () => api.get('/api/insights/tips'),
};

// Plaid API functions
export const plaidAPI = {
  createLinkToken: () => api.post('/api/plaid/create-link-token'),
  exchangePublicToken: (publicToken) => api.post('/api/plaid/exchange-public-token', { publicToken }),
  getAccounts: () => api.get('/api/plaid/accounts'),
  syncTransactions: () => api.post('/api/plaid/sync-transactions'),
};