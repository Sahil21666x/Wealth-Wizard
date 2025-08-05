
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import { api } from './lib/api';
import { ToastProvider } from './components/ui/Toast';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      
      if (token && tokenExpiry) {
        const now = new Date().getTime();
        if (now < parseInt(tokenExpiry)) {
          // Set the token in axios defaults before making API calls
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          await fetchUser();
        } else {
          // Token expired, clear it
          console.log('Token expired, logging out');
          handleLogout();
        }
      } else {
        console.log('No token found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      handleLogout();
    }
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
      console.log('User fetched successfully:', response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only logout if it's a 401 error, otherwise just set loading to false
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    const expiryTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000); // 7 days
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? 
                <LoginPage onLogin={handleLogin} /> : 
                <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/dashboard/*" 
            element={
              isAuthenticated ? 
                <Dashboard user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            } 
          />
        </Routes>
      </div>
    </Router>
    </ToastProvider>
  );
}

export default App;
