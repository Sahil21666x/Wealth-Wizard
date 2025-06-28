
const API_BASE_URL = 'http://localhost:5000/api'

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token')
}

// Make authenticated API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken()
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.reload()
    return
  }

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed')
  }
  
  return data
}

// Auth API calls
export const authAPI = {
  login: (credentials) => 
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }),
  
  register: (userData) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }),
    
  getMe: () => apiRequest('/auth/me'),
  
  updateProfile: (profileData) =>
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
}

// Transactions API calls
export const transactionsAPI = {
  getAll: () => apiRequest('/transactions'),
  
  create: (transactionData) =>
    apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    }),
    
  update: (id, transactionData) =>
    apiRequest(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    }),
    
  delete: (id) =>
    apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
    }),
}

// Goals API calls
export const goalsAPI = {
  getAll: () => apiRequest('/goals'),
  
  create: (goalData) =>
    apiRequest('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    }),
    
  update: (id, goalData) =>
    apiRequest(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    }),
    
  delete: (id) =>
    apiRequest(`/goals/${id}`, {
      method: 'DELETE',
    }),
}

// Insights API calls
export const insightsAPI = {
  getSpendingAnalysis: () => apiRequest('/insights/spending-analysis'),
  getBudgetRecommendations: () => apiRequest('/insights/budget-recommendations'),
  getPredictions: () => apiRequest('/insights/predictions'),
}

// Plaid API calls
export const plaidAPI = {
  createLinkToken: () => apiRequest('/plaid/create-link-token', { method: 'POST' }),
  exchangeToken: (publicToken) =>
    apiRequest('/plaid/exchange-public-token', {
      method: 'POST',
      body: JSON.stringify({ public_token: publicToken }),
    }),
}

export default apiRequest
