"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, Plus, Edit, Trash2, Calendar, DollarSign, TrendingUp } from "lucide-react"

const mockGoals = [
  {
    id: 1,
    name: "Emergency Fund",
    description: "Build an emergency fund to cover 6 months of expenses",
    targetAmount: 10000,
    currentAmount: 2500,
    targetDate: "2024-12-31",
    category: "Emergency",
    monthlyContribution: 500,
    status: "active",
  },
  {
    id: 2,
    name: "Vacation to Europe",
    description: "Save for a 2-week trip to Europe next summer",
    targetAmount: 3000,
    currentAmount: 1200,
    targetDate: "2024-06-15",
    category: "Travel",
    monthlyContribution: 300,
    status: "active",
  },
  {
    id: 3,
    name: "New Car",
    description: "Save for a down payment on a new car",
    targetAmount: 25000,
    currentAmount: 8500,
    targetDate: "2025-03-01",
    category: "Transportation",
    monthlyContribution: 800,
    status: "active",
  },
  {
    id: 4,
    name: "Home Down Payment",
    description: "Save for a house down payment",
    targetAmount: 50000,
    currentAmount: 50000,
    targetDate: "2024-01-01",
    category: "Housing",
    monthlyContribution: 0,
    status: "completed",
  },
]

const categories = ["Emergency", "Travel", "Transportation", "Housing", "Education", "Investment", "Other"]

export default function GoalsPage() {
  const [goals, setGoals] = useState(mockGoals)
  const [editingGoal, setEditingGoal] = useState(null)
  const [isAddingGoal, setIsAddingGoal] = useState(false)

  const activeGoals = goals.filter((goal) => goal.status === "active")
  const completedGoals = goals.filter((goal) => goal.status === "completed")

  const handleEditGoal = (goal) => {
    setEditingGoal({ ...goal })
  }

  const handleSaveGoal = (updatedGoal) => {
    if (updatedGoal.id) {
      setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)))
    } else {
      const newGoal = {
        ...updatedGoal,
        id: Math.max(...goals.map((g) => g.id)) + 1,
        currentAmount: 0,
        status: "active",
      }
      setGoals((prev) => [...prev, newGoal])
    }
    setEditingGoal(null)
    setIsAddingGoal(false)
  }

  const handleDeleteGoal = (goalId) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
  }

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100)
  }

  const getTimeRemaining = (targetDate) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Overdue"
    if (diffDays === 0) return "Due today"
    if (diffDays === 1) return "1 day left"
    if (diffDays < 30) return `${diffDays} days left`
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months left`
    return `${Math.ceil(diffDays / 365)} years left`
  }

  const getCategoryColor = (category) => {
    const colors = {
      Emergency: "bg-red-100 text-red-800",
      Travel: "bg-blue-100 text-blue-800",
      Transportation: "bg-purple-100 text-purple-800",
      Housing: "bg-green-100 text-green-800",
      Education: "bg-yellow-100 text-yellow-800",
      Investment: "bg-indigo-100 text-indigo-800",
      Other: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors["Other"]
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">Savings Goals</h1>
            <p className="text-gray-600">Track your progress towards financial goals</p>
          </div>
        </div>
        <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <GoalDialog goal={null} onSave={handleSaveGoal} onCancel={() => setIsAddingGoal(false)} />
        </Dialog>
      </div>

      {/* Goals Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-gray-500">Goals in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">Combined goal amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">Current progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Goals</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {activeGoals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                    <Badge className={getCategoryColor(goal.category)}>{goal.category}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditGoal(goal)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{goal.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(getProgressPercentage(goal.currentAmount, goal.targetAmount))}%</span>
                  </div>
                  <Progress value={getProgressPercentage(goal.currentAmount, goal.targetAmount)} className="h-2" />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>${goal.currentAmount.toLocaleString()}</span>
                    <span>${goal.targetAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{getTimeRemaining(goal.targetDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>${goal.monthlyContribution}/month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Completed Goals</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {goal.name}
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      </CardTitle>
                      <Badge className={getCategoryColor(goal.category)}>{goal.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{goal.description}</p>
                  <div className="text-2xl font-bold text-green-600">${goal.targetAmount.toLocaleString()} ✓</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Goal Dialog */}
      {editingGoal && (
        <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
          <GoalDialog goal={editingGoal} onSave={handleSaveGoal} onCancel={() => setEditingGoal(null)} />
        </Dialog>
      )}
    </div>
  )
}

function GoalDialog({ goal, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    goal || {
      name: "",
      description: "",
      targetAmount: "",
      targetDate: "",
      category: "",
      monthlyContribution: "",
    },
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      targetAmount: Number.parseFloat(formData.targetAmount),
      monthlyContribution: Number.parseFloat(formData.monthlyContribution),
    })
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{goal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
        <DialogDescription>
          {goal ? "Update your savings goal details" : "Set up a new savings goal to track your progress"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Goal Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Emergency Fund"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your goal..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="targetAmount">Target Amount</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              placeholder="10000"
              required
            />
          </div>
          <div>
            <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
            <Input
              id="monthlyContribution"
              type="number"
              step="0.01"
              value={formData.monthlyContribution}
              onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
              placeholder="500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {goal ? "Update" : "Create"} Goal
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
