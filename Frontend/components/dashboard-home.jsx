"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, Eye, EyeOff, Plus, Brain, Target, CreditCard } from "lucide-react"
import IncomeExpenseChart from "@/components/income-expense-chart"

export default function DashboardHome({ onLinkBank }) {
  const [showBalance, setShowBalance] = useState(true)

  const accountBalance = 12450.75
  const monthlyIncome = 5200
  const monthlyExpenses = 3850
  const savingsGoals = [
    { name: "Emergency Fund", current: 2500, target: 10000, color: "bg-blue-500" },
    { name: "Vacation", current: 1200, target: 3000, color: "bg-green-500" },
    { name: "New Car", current: 8500, target: 25000, color: "bg-purple-500" },
  ]

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
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Account Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Total Balance</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="text-white hover:bg-white/20"
          >
            {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{showBalance ? `$${accountBalance.toLocaleString()}` : "••••••"}</div>
          <p className="text-sm opacity-90 mt-1">+$350.00 from last month</p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${monthlyIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${monthlyExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(monthlyIncome - monthlyExpenses).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">26% of income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linked Accounts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <Button variant="link" className="text-xs p-0 h-auto text-blue-600" onClick={onLinkBank}>
              + Link new account
            </Button>
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

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Insights
            </CardTitle>
            <CardDescription>Personalized financial recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{insight.title}</h4>
                  <Badge
                    variant={
                      insight.type === "warning" ? "destructive" : insight.type === "success" ? "default" : "secondary"
                    }
                  >
                    {insight.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                <p className="text-sm font-medium text-blue-600">{insight.suggestion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Savings Goals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Savings Goals
            </CardTitle>
            <CardDescription>Track your progress towards financial goals</CardDescription>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {savingsGoals.map((goal, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{goal.name}</h4>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((goal.current / goal.target) * 100)}%
                  </span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">${goal.current.toLocaleString()}</span>
                  <span className="font-medium">${goal.target.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
