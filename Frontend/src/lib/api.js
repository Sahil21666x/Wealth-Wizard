import axios from "axios";

//added api
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const tokenExpiry = localStorage.getItem("tokenExpiry");

    if (token && tokenExpiry) {
      const now = new Date().getTime();
      if (now < parseInt(tokenExpiry)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Token expired, clear it
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
        delete api.defaults.headers.common["Authorization"];
        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiry");
      delete api.defaults.headers.common["Authorization"];
      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth API functions
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (userData) => api.put('/api/auth/profile', userData),
  changePassword: (passwordData) => api.put('/api/auth/change-password', passwordData),
  deleteAccount: () => api.delete('/api/auth/account'),
  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Transactions API functions
export const transactionsAPI = {
  getAll: (params) => api.get("/api/transactions", { params }),
  create: (data) => api.post("/api/transactions", data),
  update: (id, data) => api.put(`/api/transactions/${id}`, data),
  delete: (id) => api.delete(`/api/transactions/${id}`),
  getCategories: () => api.get("/api/transactions/categories"),
};

// Goals API functions
export const goalsAPI = {
  getAll: () => api.get("/api/goals"),
  create: (data) => api.post("/api/goals", data),
  update: (id, data) => api.put(`/api/goals/${id}`, data),
  delete: (id) => api.delete(`/api/goals/${id}`),
  contribute: (id, amount) => api.post(`/api/goals/${id}/contribute`, amount),
};

// Insights API
export const insightsAPI = {
  getInsights: (period = "monthly") =>
    api.get(`/api/insights?period=${period}`),
  getSpendingTrends: (period, category) =>
    api.get(`/api/insights/trends?period=${period}&category=${category || ""}`),
  getCategoryInsights: (startDate, endDate) =>
    api.get(
      `/api/insights/categories?startDate=${startDate}&endDate=${endDate}`,
    ),
  getIcomeExpenseTrends: () => api.get("/api/insights/income-expense-trends"),
  getSpendingPredictions: () => api.get("/api/insights/predictions"),
  getPersonalizedTips: () => api.get("/api/insights/tips"),
  getSpendingPatterns: () => api.get("/api/insights/spending"),
  getInsightsDashboard: () => api.get("/api/insights/dashboard"),
};

// Plaid API functions (now using Indian Banks API)
export const plaidAPI = {
  createLinkToken: () => api.post("/api/plaid/create-link-token"),
  exchangePublicToken: (data) =>
    api.post("/api/plaid/exchange-public-token", data),
  getAccounts: () => api.get("/api/plaid/accounts"),
  syncTransactions: () => api.post("/api/plaid/sync-transactions"),
};

// Indian Banks API functions
export const indianBanksAPI = {
  getBanks: () => api.get("/api/indian-banks/banks"),
  addAccount: (data) => api.post("/api/indian-banks/add-linked-accounts", data),
  getBranches: (bankId) =>
    api.get(`/api/indian-banks/banks/${bankId}/branches`),
  searchBanks: (query) => api.get(`/api/indian-banks/banks/search/${query}`),
  getAccounts: () => api.get("/api/indian-banks/accounts"),
  setPrimary: (accId) => api.post("/api/indian-banks/setPrimary", accId),
  getPrimary: () => api.get("/api/indian-banks/getPrimary"),
  removeBank : (bankId) => api.post(`/api/indian-banks/users/removeBankAccount/${bankId}`)
};

export const settingsAPI = {
  updateNotifications: (settings) => api.put('/api/settings/notifications', settings),
  getNotifications: () => api.get('/api/settings/notifications'),
  updatePrivacy: (settings) => api.put('/api/settings/privacy', settings),
  getPrivacy: () => api.get('/api/settings/privacy'),
  saveSubscription: (subscription) => api.post('/api/settings/save-subscription', { subscription }),
  testNotification: (type) => api.post('/api/settings/test-notification', { type })
};

export const notificationAPI = {
  sendWeeklyReports: () => api.post('/notifications/weekly-reports'),
  sendMonthlyReports: () => api.post('/notifications/monthly-reports'),
  analyzeInsights: () => api.post('/notifications/analyze-insights'),
  sendInsight: (type, data) => api.post('/notifications/send-insight', { type, data }),
  getHistory: () => api.get('/notifications/history')
};

export const aiChatAPI = {
  sendMessage: (message) => api.post('/api/ai/chat', { message }),
};


//subscribe user
  export const subscribeUser = async (userId) => {
  const register = await navigator.serviceWorker.register('/sw.js');

  const subscription = await register.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  });

  // Send subscription to backend
  await settingsAPI.saveSubscription( {
    userId,
    subscription,
  });

  
};