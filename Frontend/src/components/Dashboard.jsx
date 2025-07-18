
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import TransactionsPage from './TransactionsPage';
import GoalsPage from './GoalsPage';
import InsightsPage from './InsightsPage';
import SettingsPage from './SettingsPage';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract current tab from URL
  const getCurrentTab = () => {
    const path = location.pathname.split('/')[2];
    return path || 'home';
  };

  const [activeTab, setActiveTab] = useState(getCurrentTab());

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/dashboard/${tab === 'home' ? '' : tab}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        user={user}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<DashboardHome user={user} />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="settings" element={<SettingsPage user={user} />} />
        </Routes>
      </main>
    </div>
  );
}
