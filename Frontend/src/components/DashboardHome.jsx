
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Trophy,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import IncomeExpenseChart from './IncomeExpenseChart';
import LinkBankModal from './LinkBankModal';
import { transactionsAPI, goalsAPI, insightsAPI } from '../lib/api';

export default function DashboardHome({ user }) {
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 25847,
    monthlyIncome: 5200,
    monthlyExpenses: 3850,
    linkedAccounts: 3,
    goals: [],
    recentTransactions: [],
    insights: []
  });
  const [loading, setLoading] = useState(true);

  const aiInsights = [
    {
      type: "warning",
      title: "High Dining Expenses",
      description: "You spent 40% more on dining out this month compared to last month.",
      suggestion: "Consider meal planning to reduce dining expenses.",
    },
    {
      type: "success",
      title: "Great Savings Progress",
      description: "You're ahead of schedule on your Emergency Fund goal!",
      suggestion: "Keep up the excellent work.",
    },
    {
      type: "info",
      title: "Subscription Review",
      description: "You have 8 active subscriptions totaling $127/month.",
      suggestion: "Review and cancel unused subscriptions.",
    },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all dashboard data
      const [goalsResponse, transactionsResponse, insightsResponse] = await Promise.all([
        goalsAPI.getAll(),
        transactionsAPI.getAll({ limit: 5 }),
        insightsAPI.getInsights('monthly')
      ]);

      setDashboardData(prev => ({
        ...prev,
        goals: goalsResponse.data,
        recentTransactions: transactionsResponse.data.transactions || [],
        insights: insightsResponse.data
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
              ${dashboardData.totalBalance.toLocaleString()}
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
              ${dashboardData.monthlyIncome.toLocaleString()}
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
              ${dashboardData.monthlyExpenses.toLocaleString()}
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
              ${(dashboardData.monthlyIncome - dashboardData.monthlyExpenses).toLocaleString()}
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

      {/* Link Bank Modal */}
      <LinkBankModal 
        isOpen={showLinkBank} 
        onClose={() => setShowLinkBank(false)} 
      />
    </div>
  );
}
