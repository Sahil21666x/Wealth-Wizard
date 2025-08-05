import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, TrendingUp, Brain, PieChart } from "lucide-react";
import { insightsAPI } from "../lib/api";
import {
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import AIChatAssistant from "./AIChatAssistant";

const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#10b981'];

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await insightsAPI.getInsightsDashboard();
        console.log(response.data);
        
        setDashboardData(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load financial insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-orange-500" />
        <h2 className="mt-4 text-xl font-semibold">Unable to load insights</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!dashboardData) return null;

  // Prepare data for charts
  const spendingByCategory = dashboardData.categories.map((item, index) => ({
    name: item._id,
    value: item.totalAmount,
    color: COLORS[index % COLORS.length]
  }));

  const totalSpending = spendingByCategory.reduce((sum, item) => sum + item.value, 0);

  const weeklyTrendData = dashboardData.weeklyTrends.map(item => ({
    day: item.period.split(' ')[1], // Extract day from "MMM DD"
    amount: item.amount
  }));

  const monthlyTrendData = dashboardData.monthlyTrends.map(item => ({
    month: item.month,
    income: item.income,
    expenses: item.expenses
  }));

  // Combine all insights
  const allInsights = [
    {
      type: dashboardData.insights.spendingChange > 0 ? 'warning' : 'success',
      icon: dashboardData.insights.spendingChange > 0 ? TrendingUp : CheckCircle,
      title: dashboardData.insights.spendingChange > 0 ? 'Spending Increased' : 'Spending Under Control',
      description: `Your spending ${dashboardData.insights.spendingChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(dashboardData.insights.spendingChange)}% compared to last month.`,
      recommendation: dashboardData.insights.spendingChange > 0 
        ? 'Review your recent expenses to identify areas for reduction.' 
        : 'Great job maintaining your spending habits!',
      impact: dashboardData.insights.spendingChange > 10 ? 'High' : 'Medium'
    },
    {
      type: dashboardData.healthScore.netIncome > 0 ? 'success' : 'warning',
      icon: dashboardData.healthScore.netIncome > 0 ? CheckCircle : AlertTriangle,
      title: dashboardData.healthScore.netIncome > 0 ? 'Positive Cash Flow' : 'Negative Cash Flow',
      description: `You ${dashboardData.healthScore.netIncome > 0 ? 'saved' : 'overspent'} ₹${Math.abs(dashboardData.healthScore.netIncome).toFixed(2)} this month.`,
      recommendation: dashboardData.healthScore.netIncome > 0 
        ? 'Consider allocating some of your surplus to savings or investments.' 
        : 'Try to reduce expenses or increase income to balance your budget.',
      impact: 'High'
    },
    ...dashboardData.tips.map(tip => ({
      type: tip.priority === 'high' ? 'warning' : 'info',
      icon: tip.priority === 'high' ? AlertTriangle : Info,
      title: tip.category === 'Savings' ? 'Savings Goal' : `${tip.category} Spending`,
      description: tip.message,
      recommendation: tip.message.includes('Consider') ? 
        tip.message.split('Consider')[1].trim() : 
        'Review this area for potential improvements',
      impact: tip.priority === 'high' ? 'High' : 'Medium'
    }))
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-gray-600">Personalized financial analysis and recommendations</p>
        </div>
      </div>

      {/* Key Insights Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {allInsights.slice(0, 4).map((insight, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <insight.icon
                    className={`h-5 w-5 ${
                      insight.type === "warning"
                        ? "text-orange-600"
                        : insight.type === "success"
                          ? "text-green-600"
                          : "text-blue-600"
                    }`}
                  />
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </div>
                <Badge
                  variant={
                    insight.impact === "High" ? "destructive" : insight.impact === "Positive" ? "default" : "secondary"
                  }
                >
                  {insight.impact}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600">{insight.description}</p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900">💡 Recommendation</p>
                <p className="text-sm text-blue-800">{insight.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>This month's expense breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`₹${value.toFixed(2)}`, "Amount"]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 flex-1">
                {spendingByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">₹{category.value.toFixed(2)}</span>
                      <div className="text-xs text-gray-500">{Math.round((category.value / totalSpending) * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Monthly comparison over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrendData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`₹${value.toFixed(2)}`, ""]} 
                />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Spending Pattern</CardTitle>
          <CardDescription>Your spending habits throughout the week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyTrendData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`₹${value.toFixed(2)}`, "Spent"]} 
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Financial Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Score</CardTitle>
          <CardDescription>Overall assessment of your financial habits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {dashboardData.healthScore.score}/100
            </div>
            <p className="text-gray-600">
              {dashboardData.healthScore.score > 80 ? 'Excellent financial health' : 
               dashboardData.healthScore.score > 60 ? 'Good financial health' : 
               'Needs improvement'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Savings Rate</span>
                <span>{dashboardData.healthScore.savingsRate}%</span>
              </div>
              <Progress value={dashboardData.healthScore.savingsRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Adherence</span>
                <span>{dashboardData.healthScore.budgetAdherence}%</span>
              </div>
              <Progress value={dashboardData.healthScore.budgetAdherence} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Goal Progress</span>
                <span>{dashboardData.healthScore.goalProgress}%</span>
              </div>
              <Progress value={dashboardData.healthScore.goalProgress} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Expense Control</span>
                <span>{dashboardData.healthScore.expenseControl}%</span>
              </div>
              <Progress value={dashboardData.healthScore.expenseControl} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Assistant */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Financial Analysis Summary
              </CardTitle>
              <CardDescription>Your personalized financial health overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Financial Health Score</p>
                    <p className="text-3xl font-bold text-green-700">
                      {dashboardData.healthScore.score}/100
                    </p>
                    <p className="text-xs text-green-600">
                      {dashboardData.healthScore.score > 80 ? 'Excellent' : 
                       dashboardData.healthScore.score > 60 ? 'Good' : 'Fair'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Savings Rate</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {dashboardData.healthScore.savingsRate}%
                    </p>
                    <p className="text-xs text-blue-600">
                      {dashboardData.healthScore.savingsRate > 20 ? 'Excellent' : 
                       dashboardData.healthScore.savingsRate > 10 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">💡 Key Recommendation</h4>
                  <p className="text-sm text-yellow-700">
                    {dashboardData.healthScore.netIncome > 0 ? 
                      `You're saving ₹${dashboardData.healthScore.netIncome.toFixed(2)} monthly. Consider investing a portion for better returns.` : 
                      `You're overspending by ₹${Math.abs(dashboardData.healthScore.netIncome).toFixed(2)}. Focus on reducing expenses in your top categories.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <AIChatAssistant />
        </div>
      </div>
    </div>
  );
}