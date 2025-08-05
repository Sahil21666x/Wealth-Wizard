
const express = require('express');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');


const router = express.Router();

// Get all goals for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user._id };
    
    if (status) query.status = status;

    const goals = await Goal.find(query).sort({ createdAt: -1 });
    
    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => ({
      ...goal.toObject(),
      progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    }));

    res.json(goalsWithProgress);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new goal
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log(req.body);
    
    const goalData = {
      ...req.body,
      userId: req.user._id
    };

    const goal = new Goal(goalData);
    await goal.save();

    res.status(201).json({ 
      message: 'Goal created successfully', 
      goal: {
        ...goal.toObject(),
        progress: 0
      }
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get goal by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({
      ...goal.toObject(),
      progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update goal
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ 
      message: 'Goal updated successfully', 
      goal: {
        ...goal.toObject(),
        progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      }
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete goal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update goal progress (add money to goal)
router.post('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.currentAmount += amount;
    
    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    await goal.save();

    res.json({ 
      message: 'Progress updated successfully', 
      goal: {
        ...goal.toObject(),
        progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      }
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get goal analytics
router.get('/:id/analytics', authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining = Math.max(0, (targetDate - now) / (1000 * 60 * 60 * 24 * 30));
    const amountRemaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const recommendedMonthlyContribution = monthsRemaining > 0 ? amountRemaining / monthsRemaining : 0;

    res.json({
      progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
      amountRemaining,
      monthsRemaining: Math.ceil(monthsRemaining),
      recommendedMonthlyContribution: Math.ceil(recommendedMonthlyContribution),
      onTrack: goal.currentAmount >= (goal.targetAmount * ((new Date() - new Date(goal.createdAt)) / (targetDate - new Date(goal.createdAt))))
    });
  } catch (error) {
    console.error('Error getting goal analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post("/:id/contribute", authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const contributionAmount = Number(amount);

    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Add transaction
    goal.transactions.push({
      amount: contributionAmount,
      description,
      type: "contribution",
      date: new Date(),
    });

    // Update current amount
    goal.currentAmount += contributionAmount;

    if (goal.currentAmount >= goal.targetAmount) {
      goal.currentAmount = goal.targetAmount;
      goal.status = "completed";
    }

    // Check and update milestones
    goal.milestones = goal.milestones.map((milestone) => {
      if (!milestone.achieved && goal.currentAmount >= milestone.amount) {
        milestone.achieved = true;
        milestone.achievedDate = new Date();
      }
      return milestone;
    });

    const updatedGoal = await goal.save();

    // Send notification for goal progress
    const noti =await notificationService.sendGoalProgressNotification(req.user._id, goal._id, contributionAmount);
    console.log(noti);
    

    res.json({ message: "Contribution successful", updatedGoal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Process auto-contributions for all eligible goals
router.post("/process-auto-contributions", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all active goals with auto-contribute enabled
    const goals = await Goal.find({
      userId,
      status: "active",
      "autoContribute.enabled": true,
    });

    let processedCount = 0;
    const results = [];

    for (const goal of goals) {
      // Check if it's time for auto-contribution based on frequency
      const now = new Date();
      const lastTransaction = goal.transactions
        .filter(t => t.type === "contribution")
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      let shouldContribute = false;
      
      if (!lastTransaction) {
        shouldContribute = true;
      } else {
        const daysSinceLastContribution = Math.floor(
          (now - new Date(lastTransaction.date)) / (1000 * 60 * 60 * 24)
        );

        switch (goal.autoContribute.frequency) {
          case "daily":
            shouldContribute = daysSinceLastContribution >= 1;
            break;
          case "weekly":
            shouldContribute = daysSinceLastContribution >= 7;
            break;
          case "monthly":
            shouldContribute = daysSinceLastContribution >= 30;
            break;
        }
      }

      if (shouldContribute && goal.currentAmount < goal.targetAmount) {
        // Add auto-contribution transaction
        goal.transactions.push({
          amount: goal.autoContribute.amount,
          description: `Auto-contribution (${goal.autoContribute.frequency})`,
          type: "contribution",
          date: now,
        });

        // Update current amount
        goal.currentAmount += goal.autoContribute.amount;

        if (goal.currentAmount >= goal.targetAmount) {
          goal.currentAmount = goal.targetAmount;
          goal.status = "completed";
        }

        // Check and update milestones
        goal.milestones = goal.milestones.map((milestone) => {
          if (!milestone.achieved && goal.currentAmount >= milestone.amount) {
            milestone.achieved = true;
            milestone.achievedDate = new Date();
          }
          return milestone;
        });

        await goal.save();
        processedCount++;
        results.push({
          goalId: goal._id,
          goalTitle: goal.title,
          contributedAmount: goal.autoContribute.amount,
          newTotal: goal.currentAmount,
        });
      }
    }

    res.json({
      message: `Processed ${processedCount} auto-contributions`,
      processedCount,
      results,
    });
  } catch (error) {
    console.error("Error processing auto-contributions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle auto-contribute for a goal
router.patch("/:id/auto-contribute", authMiddleware, async (req, res) => {
  try {
    const { enabled, amount, frequency } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    goal.autoContribute = {
      enabled: Boolean(enabled),
      amount: Number(amount) || goal.autoContribute.amount,
      frequency: frequency || goal.autoContribute.frequency,
    };

    await goal.save();

    res.json({
      message: "Auto-contribute settings updated successfully",
      goal: {
        ...goal.toObject(),
        progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
      },
    });
  } catch (error) {
    console.error("Error updating auto-contribute settings:", error);
    res.status(500).json({ message: "Server error" });
  }
});




module.exports = router;
