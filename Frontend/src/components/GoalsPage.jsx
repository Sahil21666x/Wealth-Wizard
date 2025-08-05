"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  Coins,
  Settings,
  Zap,
} from "lucide-react";
import { goalsAPI } from "@/lib/api";

const categories = [
  "Emergency",
  "Travel",
  "Transportation",
  "Housing",
  "Education",
  "Investment",
  "Vacation",
  "Retirement",
  "Other",
];

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [autoContributeGoal, setAutoContributeGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await goalsAPI.getAll();
        setGoals(res.data);
        console.log("goals : ", res.data);
      } catch (err) {
        console.error("Failed to load goals", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const handleEditGoal = (goal) => setEditingGoal({ ...goal });
  const handleContribute = (goal) => setContributingGoal(goal);

  const handleSaveGoal = async (goalData) => {
    try {
      let updatedGoal;
      if (goalData._id) {
        const res = await goalsAPI.update(goalData._id, goalData);
        updatedGoal = res.data.goal;
        setGoals((prev) =>
          prev.map((g) => (g._id === goalData._id ? updatedGoal : g)),
        );
      } else {
        const res = await goalsAPI.create(goalData);
        updatedGoal = res.data.goal;
        setGoals((prev) => [...prev, updatedGoal]);
      }
      setEditingGoal(null);
      setIsAddingGoal(false);
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await goalsAPI.delete(goalId);
      setGoals((prev) => prev.filter((g) => g._id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleContribution = async ({ goalId, amount, description }) => {
    try {
      const res = await goalsAPI.contribute(goalId, { amount, description });
      const updatedGoal = res.data.updatedGoal;
      setGoals((prev) =>
        prev.map((g) => (g._id === updatedGoal._id ? updatedGoal : g)),
      );
      setContributingGoal(null);
    } catch (err) {
      console.error("Contribution failed:", err);
    }
  };

  const handleAutoContributeUpdate = async ({ goalId, enabled, amount, frequency }) => {
    try {
      const res = await goalsAPI.updateAutoContribute(goalId, { enabled, amount, frequency });
      const updatedGoal = res.data.goal;
      setGoals((prev) =>
        prev.map((g) => (g._id === updatedGoal._id ? updatedGoal : g)),
      );
      setAutoContributeGoal(null);
    } catch (err) {
      console.error("Auto-contribute update failed:", err);
    }
  };

  const processAutoContributions = async () => {
    try {
      const res = await goalsAPI.processAutoContributions();
      console.log("Auto-contributions processed:", res.data);
      // Refresh goals after processing
      const goalsRes = await goalsAPI.getAll();
      setGoals(goalsRes.data);
    } catch (err) {
      console.error("Auto-contribution processing failed:", err);
    }
  };

  const getProgressPercentage = (current, target) =>
    Math.min((current / target) * 100, 100);

  const getTimeRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "1 day left";
    if (diffDays < 30) return `${diffDays} days left`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months left`;
    return `${Math.ceil(diffDays / 365)} years left`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      Emergency: "bg-red-100 text-red-800",
      Travel: "bg-blue-100 text-blue-800",
      Transportation: "bg-purple-100 text-purple-800",
      Housing: "bg-green-100 text-green-800",
      Education: "bg-yellow-100 text-yellow-800",
      Investment: "bg-indigo-100 text-indigo-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.Other;
  };

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const completedGoals = goals.filter((goal) => goal.status === "completed");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between my-3">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">Savings Goals</h1>
            <p className="text-gray-600">
              Track your progress towards financial goals
            </p>
          </div>
        </div>
       <div className="flex flex-col sm:flex-row gap-2">
  <Button 
    variant="outline" 
    onClick={processAutoContributions}
    className="w-full sm:w-auto"
  >
    <Zap className="h-4 w-4 mr-2" />
    <span className="hidden xs:inline">Process Auto-Contributions</span>
    <span className="xs:hidden">Auto-Process</span>
  </Button>
  <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
    <DialogTrigger asChild>
      <Button className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        <span className="hidden xs:inline">Add Goal</span>
        <span className="xs:hidden">Add Goal</span>
      </Button>
    </DialogTrigger>
    <GoalDialog
      goal={null}
      onSave={handleSaveGoal}
      onCancel={() => setIsAddingGoal(false)}
    />
  </Dialog>
</div>
      </div>

      {/* Goals */}
      {loading ? (
        <p>Loading goals...</p>
      ) : (
        <>
          {/* Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Goals
                </CardTitle>
                <Target className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeGoals.length}</div>
                <p className="text-xs text-gray-500">Goals in progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹
                  {activeGoals
                    .reduce((sum, g) => sum + g.targetAmount, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">Combined goal amount</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Saved
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹
                  {activeGoals
                    .reduce((sum, g) => sum + g.currentAmount, 0)
                    .toLocaleString()}
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
                <Card key={goal._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <Badge className={getCategoryColor(goal.category)}>
                          {goal.category}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAutoContributeGoal(goal)}
                          title="Auto-contribute settings"
                        >
                          <Zap className={`h-4 w-4 ${goal.autoContribute?.enabled ? 'text-green-500' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGoal(goal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal._id)}
                        >
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
                        <span>
                          {Math.round(
                            getProgressPercentage(
                              goal.currentAmount,
                              goal.targetAmount,
                            ),
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={getProgressPercentage(
                          goal.currentAmount,
                          goal.targetAmount,
                        )}
                        className="h-2"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>₹{goal.currentAmount.toLocaleString()}</span>
                        <span>₹{goal.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{getTimeRemaining(goal.targetDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>₹{goal.monthlyContribution}/month</span>
                      </div>
                    </div>
                    
                    {goal.autoContribute?.enabled && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                        <Zap className="h-4 w-4" />
                        <span>Auto: ₹{goal.autoContribute.amount} {goal.autoContribute.frequency}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleContribute(goal)}
                      className="w-full"
                    >
                      <Coins className="h-4 w-4 mr-2" /> Contribute
                    </Button>
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
                  <Card key={goal._id} className="opacity-75">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {goal.title}
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          Completed
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {goal.description}
                      </p>
                      <div className="text-2xl font-bold text-green-600">
                        ₹{goal.targetAmount.toLocaleString()} ✓
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Dialogs */}
          {editingGoal && (
            <Dialog open onOpenChange={() => setEditingGoal(null)}>
              <GoalDialog
                goal={editingGoal}
                onSave={handleSaveGoal}
                onCancel={() => setEditingGoal(null)}
              />
            </Dialog>
          )}

          {contributingGoal && (
            <Dialog open onOpenChange={() => setContributingGoal(null)}>
              <ContributeDialog
                goal={contributingGoal}
                onContribute={handleContribution}
                onCancel={() => setContributingGoal(null)}
              />
            </Dialog>
          )}

          {autoContributeGoal && (
            <Dialog open onOpenChange={() => setAutoContributeGoal(null)}>
              <AutoContributeDialog
                goal={autoContributeGoal}
                onSave={handleAutoContributeUpdate}
                onCancel={() => setAutoContributeGoal(null)}
              />
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}

function ContributeDialog({ goal, onContribute, onCancel }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onContribute({ goalId: goal._id, amount: parseFloat(amount), description });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Contribute to {goal.title}</DialogTitle>
        <DialogDescription>
          Track a new transaction toward your savings goal.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Contribute
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function AutoContributeDialog({ goal, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    enabled: goal.autoContribute?.enabled || false,
    amount: goal.autoContribute?.amount || "",
    frequency: goal.autoContribute?.frequency || "monthly",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      goalId: goal._id,
      enabled: formData.enabled,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Auto-Contribute Settings</DialogTitle>
        <DialogDescription>
          Set up automatic contributions to {goal.title}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enabled">Enable Auto-Contribute</Label>
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, enabled: checked })
            }
          />
        </div>

        {formData.enabled && (
          <>
            <div>
              <Label htmlFor="amount">Contribution Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="500"
                required
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Save Settings
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function GoalDialog({ goal, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    goal || {
      title: "",
      description: "",
      targetAmount: "",
      targetDate: "",
      category: "",
      monthlyContribution: "",
    },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      monthlyContribution: parseFloat(formData.monthlyContribution),
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{goal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
        <DialogDescription>
          {goal
            ? "Update your savings goal details"
            : "Set up a new savings goal to track your progress"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Goal Name</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
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
              onChange={(e) =>
                setFormData({ ...formData, targetAmount: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthlyContribution: e.target.value,
                })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, targetDate: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 bg-transparent"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {goal ? "Update" : "Create"} Goal
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
