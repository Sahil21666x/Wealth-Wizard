import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  EyeOff,
  Trophy,
  Target,
  Plus,
  Brain,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Building2,
  CheckCircle,
  ArrowUpRight,
  Info
} from 'lucide-react';
import IncomeExpenseChart from './IncomeExpenseChart';
import LinkBankModal from './LinkBankModal';
import { transactionsAPI, goalsAPI, insightsAPI, plaidAPI, indianBanksAPI } from '../lib/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function DashboardHome({ user }) {
  const [showBalance, setShowBalance] = useState(true);
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalStep, setModalStep] = useState(1);
  const [primaryAc, setPrimaryAc] = useState()
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate()


  const [aiInsights, setAiInsights] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    recentTransactions: [],
    goals: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);



  const fetchConnectedAccounts = async () => {
    try {
      const response = await indianBanksAPI.getAccounts();

      // console.log("connected ac :", response.data.accounts);

      setConnectedAccounts(response.data.accounts || []);

      // const primary = response.data.accounts.find({isPrimary:true})
      // console.log(primary,"primary");

    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      setConnectedAccounts([]);
    }
  };

  // console.log(connectedAccounts,"connected accounts");


  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      //fetching Primary Account
      const primaryAc = await indianBanksAPI.getPrimary()

      setPrimaryAc(primaryAc.data[0])

      // Fetch all dashboard data
      const [goalsResponse, transactionsResponse, insightsResponse, tipsResponse] = await Promise.allSettled([
        goalsAPI.getAll(),
        transactionsAPI.getAll({ limit: 5 }),
        insightsAPI.getInsights('monthly'),
        insightsAPI.getPersonalizedTips(),
      ]);


      setDashboardData(prev => ({
        ...prev,
        goals: goalsResponse.status === 'fulfilled' ? goalsResponse.value.data : [],
        recentTransactions: transactionsResponse.status === 'fulfilled' ? (transactionsResponse.value.data.transactions || []) : [],
        insights: insightsResponse.status === 'fulfilled' ? insightsResponse.value.data : {},
      }));

      // Transform tips into AI insights format
      if (tipsResponse.status === 'fulfilled' && Array.isArray(tipsResponse.value.data)) {
        const transformedInsights = tipsResponse.value.data.map(tip => ({
          type: tip.priority === 'high' ? 'warning' : tip.priority === 'medium' ? 'info' : 'success',
          title: tip.message.split('.')[0],
          description: tip.message,
          suggestion: `Focus on ${tip.category} category optimization.`
        }));
        setAiInsights(transformedInsights.slice(0, 3)); // Show top 3 insights
      } else {
        // Fallback insights
        setAiInsights([
          {
            type: "info",
            title: "Welcome to WealthWizard",
            description: "Start by adding some transactions to get personalized insights.",
            suggestion: "Connect your bank account or add manual transactions.",
          }
        ]);
      }
      await fetchConnectedAccounts();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to sample insights if API fails
      setAiInsights([
        {
          type: "info",
          title: "Welcome to WealthWizard",
          description: "Start by adding some transactions to get personalized insights.",
          suggestion: "Connect your bank account or add manual transactions.",
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightBadgeVariant = (type) => {
    switch (type) {
      case 'warning':
        return 'destructive';
      case 'success':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleSetPrimary = async (accountId) => {
    try {
      console.log("acccountId setp", accountId);

      // Optimistically update UI
      const updatedAccounts = connectedAccounts.map(account => ({
        ...account,
        isPrimary: account.accountId === accountId,
      }));
      setConnectedAccounts(updatedAccounts);

      // Make backend API call
      const primaryRes = await indianBanksAPI.setPrimary({ accountId });
      console.log(primaryRes, "primaryRes :");


      // Optional: re-fetch for sync
      fetchDashboardData();
    } catch (err) {
      console.error("Error setting primary account:", err);
      // Optionally show error toast or revert state
    }
  };

  const handleDeleteAccount = async (accountId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this account?');
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await indianBanksAPI.removeBank(accountId);
      fetchConnectedAccounts(); // refresh list after deletion
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Error deleting account');
    } finally {
      setDeleting(false);
    }
  };



  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between my-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">Here's your financial overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowLinkBank(true)}
            disabled = {connectedAccounts.length>=3}
            >
            <CreditCard className="w-4 h-4 mr-2" />
            Link Bank Account
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{primaryAc?.balances?.current.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {dashboardData.insights.balanceChange > 0 ? '+' : ''}{dashboardData.insights.balanceChange?.toFixed(1) || 0}% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{dashboardData?.insights?.totalIncome?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {dashboardData.insights.incomeChange > 0 ? '+' : ''}
                {dashboardData.insights.incomeChange?.toFixed(1) || 0}% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹ {dashboardData?.insights?.totalExpenses?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {dashboardData.insights.spendingChange > 0 ? '+' : ''}{dashboardData.insights.spendingChange?.toFixed(1) || 0}% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{(dashboardData?.insights?.netIncome)?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.insights.savingsChange > 0 ? '+' : ''}{dashboardData.insights.savingsChange?.toFixed(1) || 0}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Last 6 months comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart />
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/transactions')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentTransactions.length > 0 ? (
                dashboardData.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                      }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.category?.primary}</p>
                    </div>
                    <div className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Connect your bank account to see transactions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goals Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Savings Goals</CardTitle>
              <CardDescription>Track your financial objectives</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/goals')}>
              Manage Goals
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {dashboardData.goals.length > 0 ? (
                dashboardData.goals.slice(0, 3).map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{goal.title}</p>
                        <p className="text-xs text-gray-500">
                          ₹{goal.currentAmount} of ₹{goal.targetAmount}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                      </Badge>
                    </div>
                    <Progress
                      value={(goal.currentAmount / goal.targetAmount) * 100}
                      className="h-2"
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No goals yet</p>
                  <p className="text-sm">Set your first savings goal to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>AI Insights</span>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                AI Powered
              </Badge>
            </CardTitle>
            <CardDescription>Personalized financial recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start space-x-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{insight.title}</h4>
                        <Badge variant={getInsightBadgeVariant(insight.type)} className="text-xs">
                          {insight.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{insight.description}</p>
                      <p className="text-xs text-blue-600 font-medium">{insight.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 lg:grid-cols-1">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-base sm:text-lg">Connected Accounts</span>
            </CardTitle>
            <CardDescription>Your linked bank accounts</CardDescription>
          </div>
          <Button
           size="sm" 
           onClick={() => setShowLinkBank(true)}
           disabled = {connectedAccounts.length>=3}
            // className={`${someCondition ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Link Account</span>
            <span className="sm:hidden">Link</span>
          </Button>
        </CardHeader>

        <CardContent>
          {connectedAccounts.length > 0 ? (
            <div className="space-y-3">
              {connectedAccounts.map((account, index) => (
                <div
                  key={account.accountId || index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-gray-50 gap-4"
                >
                  {/* Left: Bank Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{account.bankName}</p>
                      <p className="text-sm text-gray-600 capitalize">{account.type} Account</p>
                      {account.bankName && (
                        <p className="text-xs text-gray-500 truncate">{account.bankName}</p>
                      )}
                      {account.last_sync && (
                        <p className="text-xs text-gray-500">Last sync: {account.last_sync}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions and Balance */}
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetPrimary(account.accountId)}
                        disabled={account.isPrimary}
                      >
                        {account.isPrimary ? 'Primary' : 'Set Primary'}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAccount(account.accountId)}
                        disabled={deleting}
                      >
                        Delete
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Connected
                      </Badge>
                    </div>

                    {account.balances && (
                      <p className="text-sm font-medium">
                        ₹{account.balances.current?.toLocaleString() || '0.00'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Connected Accounts</h3>
              <p className="text-gray-600 mb-4">
                Link your bank accounts to get started with automatic transaction tracking
              </p>
              <Button onClick={() => setShowLinkBank(true)}>
                <CreditCard className="w-4 h-4 mr-2" />
                Link Your First Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

      {/* Link Bank Modal */}
      <LinkBankModal
        isOpen={showLinkBank}
        onClose={() => {
          setModalStep(1);          // Reset step when closed
          setShowLinkBank(false);   // Hide modal
          fetchDashboardData()
        }}
        step={modalStep}
        setStep={setModalStep}
        connectedAccounts={connectedAccounts}
      />


    </div>
  );
}