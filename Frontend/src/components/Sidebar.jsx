
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Home, 
  CreditCard, 
  Target, 
  Brain, 
  Settings, 
  LogOut,
  DollarSign,
  Trophy,
  TrendingUp
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '', icon: Home, key: 'home' },
  { name: 'Transactions', href: 'transactions', icon: CreditCard, key: 'transactions' },
  { name: 'Goals', href: 'goals', icon: Target, key: 'goals' },
  { name: 'Insights', href: 'insights', icon: Brain, key: 'insights' },
  { name: 'Settings', href: 'settings', icon: Settings, key: 'settings' },
];

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const navigate = useNavigate();

  const handleNavigation = (tab) => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FinanceAI
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.key)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
