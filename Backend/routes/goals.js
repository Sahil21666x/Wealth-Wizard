
const express = require('express');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

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

module.exports = router;
