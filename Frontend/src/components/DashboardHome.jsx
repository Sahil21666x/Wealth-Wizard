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

export default function DashboardHome({ user }) {
  const [showBalance, setShowBalance] = useState(true);
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalStep, setModalStep] = useState(1);


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
      console.log("connected ac :", response.data.accounts);
      
      setConnectedAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      setConnectedAccounts([]);
    }
  };

  const handleAccountLinked = (accountInfo) => {
    // Add the newly linked account to the connected accounts list
    console.log("Linked account received in parent:", accountInfo);
    const newAccount = {
      account_id: `new_${Date.now()}`,
      name: `${accountInfo.bankName} - ****${accountInfo.accountNumber}`,
      type: 'depository',
      subtype: 'checking',
      balances: {
        available: 0,
        current: 0
      },
      bank_name: accountInfo.bankName,
      branch_name: accountInfo.branchName,
      ifsc: accountInfo.ifsc,
      status: 'connected',
      last_sync: new Date().toLocaleDateString()
    };

    setConnectedAccounts(prev => [...prev, newAccount]);

    // Refresh data after linking account
    fetchDashboardData();
  };
  console.log(connectedAccounts,"connected accounts");
  

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all dashboard data
      const [goalsResponse, transactionsResponse, insightsResponse, tipsResponse] = await Promise.allSettled([
        goalsAPI.getAll(),
        transactionsAPI.getAll({ limit: 5 }),
        insightsAPI.getInsights('monthly'),
        insightsAPI.getPersonalizedTips()
      ]);

      setDashboardData(prev => ({
        ...prev,
        goals: goalsResponse.status === 'fulfilled' ? goalsResponse.value.data : [],
        recentTransactions: transactionsResponse.status === 'fulfilled' ? (transactionsResponse.value.data.transactions || []) : [],
        insights: insightsResponse.status === 'fulfilled' ? insightsResponse.value.data : {}
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
            title: "Welcome to FinanceAI",
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
          title: "Welcome to FinanceAI",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">Here's your financial overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Trophy className="w-3 h-3 mr-1" />
            Level {user?.gamification?.level || 1}
          </Badge>
          <Button onClick={() => setShowLinkBank(true)}>
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
              ₹{connectedAccounts[0].balances.available.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% from last month
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
              ₹{dashboardData.monthlyIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +8.2% from last month
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
              ₹{dashboardData.monthlyExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +3.1% from last month
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
              ₹{(dashboardData.monthlyIncome - dashboardData.monthlyExpenses).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">26% of income</p>
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
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentTransactions.length > 0 ? (
                dashboardData.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' 
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
                    <div className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
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
            <Button variant="outline" size="sm">
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
                          ${goal.currentAmount} of ${goal.targetAmount}
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
        {/* Connected Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Connected Accounts
              </CardTitle>
              <CardDescription>Your linked bank accounts</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowLinkBank(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Link Account
            </Button>
          </CardHeader>
          <CardContent>
            {connectedAccounts.length > 0 ? (
              <div className="space-y-3">
                {connectedAccounts.map((account, index) => (
                  <div key={account.account_id || index} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{account.subtype} Account</p>
                        {account.bank_name && (
                          <p className="text-xs text-gray-500">{account.bank_name}</p>
                        )}
                        {account.last_sync && (
                          <p className="text-xs text-gray-500">Last sync: {account.last_sync}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                      {account.balances && (
                        <p className="text-sm font-medium mt-1">
                          ${account.balances.current?.toLocaleString() || '0.00'}
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
                <p className="text-gray-600 mb-4">Link your bank accounts to get started with automatic transaction tracking</p>
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
  }}
  step={modalStep}
  setStep={setModalStep}
  onAccountLinked={handleAccountLinked}
/>


    </div>
  );
}