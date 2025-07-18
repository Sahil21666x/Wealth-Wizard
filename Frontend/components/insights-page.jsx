"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Info } from "lucide-react"
import {
  PieChart,
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
} from "recharts"

const spendingByCategory = [
  { name: "Food & Dining", value: 850, color: "#f97316" },
  { name: "Transportation", value: 420, color: "#3b82f6" },
  { name: "Shopping", value: 680, color: "#8b5cf6" },
  { name: "Entertainment", value: 320, color: "#ec4899" },
  { name: "Bills & Utilities", value: 1200, color: "#ef4444" },
  { name: "Healthcare", value: 180, color: "#10b981" },
]

const monthlyTrends = [
  { month: "Jul", spending: 3200, budget: 3500 },
  { month: "Aug", spending: 3400, budget: 3500 },
  { month: "Sep", spending: 3600, budget: 3500 },
  { month: "Oct", spending: 3800, budget: 3500 },
  { month: "Nov", spending: 3500, budget: 3500 },
  { month: "Dec", spending: 3850, budget: 3500 },
]

const spendingTrend = [
  { day: "Mon", amount: 45 },
  { day: "Tue", amount: 78 },
  { day: "Wed", amount: 32 },
  { day: "Thu", amount: 95 },
  { day: "Fri", amount: 120 },
  { day: "Sat", amount: 85 },
  { day: "Sun", amount: 65 },
]

const insights = [
  {
    type: "warning",
    icon: AlertTriangle,
    title: "Budget Exceeded",
    description: "You've exceeded your monthly budget by $350 this month.",
    recommendation: "Consider reducing dining out expenses or adjusting your budget.",
    impact: "High",
  },
  {
    type: "success",
    icon: CheckCircle,
    title: "Savings Goal Progress",
    description: "You're 15% ahead of schedule on your Emergency Fund goal.",
    recommendation: "Great job! Consider increasing your monthly contribution.",
    impact: "Positive",
  },
  {
    type: "info",
    icon: Info,
    title: "Subscription Analysis",
    description: "You have 8 active subscriptions costing $127/month.",
    recommendation: "Review and cancel unused subscriptions to save money.",
    impact: "Medium",
  },
  {
    type: "warning",
    icon: TrendingUp,
    title: "Increased Spending Pattern",
    description: "Your shopping expenses increased by 40% compared to last month.",
    recommendation: "Set a shopping budget limit to control expenses.",
    impact: "Medium",
  },
]

export default function InsightsPage() {
  const totalSpending = spendingByCategory.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground">Personalized financial analysis and recommendations</p>
        </div>
      </div>

      {/* Key Insights Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight, index) => (
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
              <p className="text-muted-foreground">{insight.description}</p>
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
                    <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
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
                      <span className="font-medium">${category.value}</span>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((category.value / totalSpending) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Budget vs Spending */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Spending</CardTitle>
            <CardDescription>Monthly comparison over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrends}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, ""]} />
                <Bar dataKey="budget" fill="#e5e7eb" name="Budget" />
                <Bar dataKey="spending" fill="#3b82f6" name="Spending" />
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
            <LineChart data={spendingTrend}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, "Spent"]} />
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
            <div className="text-4xl font-bold text-green-600 mb-2">78/100</div>
            <p className="text-muted-foreground">Good financial health</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Savings Rate</span>
                <span>26%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Adherence</span>
                <span>72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Goal Progress</span>
                <span>89%</span>
              </div>
              <Progress value={89} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Expense Control</span>
                <span>65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
