const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const authMiddleware = require('../middleware/auth');
const aiService = require('../services/aiService');
const moment = require('moment');



// Get financial insights
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const insights = await generateInsights(req.user._id, period);
    res.json(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get spending predictions
router.get('/predictions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      userId: req.user._id,
      type: 'expense'
    }).sort({ date: -1 }).limit(100);

    const predictions = await aiService.predictSpending(transactions);
    res.json(predictions);
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get personalized tips
router.get('/tips', authMiddleware, async (req, res) => {
  try {
    const tips = await generatePersonalizedTips(req.user._id);
    res.json(tips);
  } catch (error) {
    console.error('Error generating tips:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get spending trends
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const { period = 'monthly', category } = req.query;
    const trends = await getSpendingTrends(req.user._id, period, category);
    res.json(trends);
  } catch (error) {
    console.error('Error getting spending trends:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate insights
async function generateInsights(userId, period) {
  const startDate = moment().subtract(1, period === 'weekly' ? 'week' : 'month').startOf('day');
  const endDate = moment().endOf('day');

  // Get transactions for the period
  const transactions = await Transaction.find({
    userId,
    date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
  });

  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown
  const categoryBreakdown = expenses.reduce((acc, t) => {
    const category = t.category.primary;
    acc[category] = (acc[category] || 0) + t.amount;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Compare with previous period
  const prevStartDate = moment(startDate).subtract(1, period === 'weekly' ? 'week' : 'month');
  const prevEndDate = moment(endDate).subtract(1, period === 'weekly' ? 'week' : 'month');

  const prevTransactions = await Transaction.find({
    userId,
    date: { $gte: prevStartDate.toDate(), $lte: prevEndDate.toDate() },
    type: 'expense'
  });

  const prevTotalExpenses = prevTransactions.reduce((sum, t) => sum + t.amount, 0);
  const spendingChange = ((totalExpenses - prevTotalExpenses) / (prevTotalExpenses || 1)) * 100;

  return {
    period,
    totalExpenses,
    totalIncome,
    netIncome: totalIncome - totalExpenses,
    spendingChange: Math.round(spendingChange * 100) / 100,
    topCategories: topCategories.map(([category, amount]) => ({ category, amount })),
    transactionCount: transactions.length,
    averageTransactionAmount: transactions.length > 0 ? totalExpenses / expenses.length : 0
  };
}

// Helper function to generate personalized tips
async function generatePersonalizedTips(userId) {
  const lastMonth = moment().subtract(1, 'month');
  const thisMonth = moment();

  const transactions = await Transaction.find({
    userId,
    date: { $gte: lastMonth.toDate(), $lte: thisMonth.toDate() },
    type: 'expense'
  });

  const tips = [];

  // Category-based tips
  const categorySpending = transactions.reduce((acc, t) => {
    const category = t.category.primary;
    acc[category] = (acc[category] || 0) + t.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)[0];

  if (topCategory) {
    const [category, amount] = topCategory;
    tips.push({
      type: 'spending',
      category,
      message: `You spent $${amount.toFixed(2)} on ${category} this month. Consider setting a budget limit for this category.`,
      priority: 'medium'
    });
  }

  // Frequency-based tips
  const restaurantTransactions = transactions.filter(t => 
    t.category.primary === 'Food and Drink' || 
    t.description.toLowerCase().includes('restaurant')
  );

  if (restaurantTransactions.length > 15) {
    tips.push({
      type: 'habit',
      category: 'Food and Drink',
      message: `You ate out ${restaurantTransactions.length} times this month. Cooking at home more often could save you money.`,
      priority: 'high'
    });
  }

  // Goals-related tips
  const goals = await Goal.find({ userId, status: 'active' });
  for (const goal of goals) {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysLeft = moment(goal.targetDate).diff(moment(), 'days');
    
    if (progress < 50 && daysLeft < 60) {
      tips.push({
        type: 'goal',
        category: 'Savings',
        message: `You're ${progress.toFixed(0)}% towards your ${goal.title} goal with ${daysLeft} days left. Consider increasing your monthly contribution.`,
        priority: 'high'
      });
    }
  }

  return tips;
}

// Helper function to get spending trends
async function getSpendingTrends(userId, period, category) {
  const periods = period === 'weekly' ? 12 : 6; // 12 weeks or 6 months
  const unit = period === 'weekly' ? 'week' : 'month';

  const trends = [];

  for (let i = periods - 1; i >= 0; i--) {
    const startDate = moment().subtract(i, unit).startOf(unit);
    const endDate = moment().subtract(i, unit).endOf(unit);

    const query = {
      userId,
      type: 'expense',
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    };

    if (category) {
      query['category.primary'] = category;
    }

    const transactions = await Transaction.find(query);
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    trends.push({
      period: startDate.format(period === 'weekly' ? 'MMM DD' : 'MMM YYYY'),
      amount: totalAmount,
      transactionCount: transactions.length
    });
  }

  return trends;
}


// Get spending insights
router.get('/spending', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      userId: req.user._id 
    }).sort({ date: -1 }).limit(100);

    const insights = {
      spendingPrediction: await aiService.predictSpending(transactions),
      anomalies: await aiService.detectAnomalies(transactions),
      patterns: aiService.analyzeSpendingPatterns(transactions)
    };

    res.json(insights);
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get category insights
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { 
      userId: req.user._id,
      type: 'expense'
    };
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const categoryInsights = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category.primary',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json(categoryInsights);
  } catch (error) {
    console.error('Error getting category insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
