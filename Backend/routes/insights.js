const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const authMiddleware = require('../middleware/auth');
const aiService = require('../services/aiService');
const moment = require('moment');
const Account = require('../models/Account');

// Get comprehensive financial insights dashboard data
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const [insights, trends, incomeExpense, categories, tips, healthScore] = await Promise.all([
      generateInsights(req.user._id, 'monthly'),
      getSpendingTrends(req.user._id, 'weekly'),
      getIncomeExpenseTrends(req.user._id),
      getCategoryInsights(req.user._id),
      generatePersonalizedTips(req.user._id),
      calculateFinancialHealthScore(req.user._id)
    ]);

    res.json({
      insights,
      weeklyTrends: trends,
      monthlyTrends: incomeExpense,
      categories,
      tips,
      healthScore
    });
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get financial health score
router.get('/health-score', authMiddleware, async (req, res) => {
  try {
    const score = await calculateFinancialHealthScore(req.user._id);
    res.json(score);
  } catch (error) {
    console.error('Error calculating health score:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Monthly income and expense trends for chart for last 6 months
async function getIncomeExpenseTrends(userId) {
  const monthsToInclude = 6;
  const trends = [];

  const primaryAc = await Account.findOne({ userId, isPrimary: true });
  if (!primaryAc) throw new Error('Primary account not found');

  const accountId = primaryAc.accountId;

  for (let i = monthsToInclude - 1; i >= 0; i--) {
    const start = moment().subtract(i, 'months').startOf('month');
    const end = moment().subtract(i, 'months').endOf('month');

    const transactions = await Transaction.find({
      userId,
      accountId,
      date: { $gte: start.toDate(), $lte: end.toDate() }
    });

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    trends.push({
      month: start.format('MMM'),
      income,
      expenses
    });
  }

  return trends;
}

// Calculate comprehensive financial health score
async function calculateFinancialHealthScore(userId) {
  const primaryAc = await Account.findOne({ userId, isPrimary: true });
  if (!primaryAc) throw new Error('Primary account not found');
  
  const accountId = primaryAc.accountId;
  const now = moment();
  const monthStart = now.clone().startOf('month');
  const lastMonthStart = now.clone().subtract(1, 'month').startOf('month');
  
  // Get current month transactions
  const currentTransactions = await Transaction.find({
    userId,
    accountId,
    date: { $gte: monthStart.toDate() }
  });
  
  // Get last month transactions for comparison
  const lastMonthTransactions = await Transaction.find({
    userId,
    accountId,
    date: { $gte: lastMonthStart.toDate(), $lt: monthStart.toDate() }
  });
  
  // Calculate basic metrics
  const currentIncome = currentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentExpenses = currentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const lastMonthIncome = lastMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate components
  const savingsRate = currentIncome > 0 
    ? ((currentIncome - currentExpenses) / currentIncome) * 100 
    : 0;
  
  const budgetAdherence = await calculateBudgetAdherence(userId, currentExpenses);
  const goalProgress = await calculateGoalProgress(userId);
  const expenseControl = calculateExpenseControl(currentExpenses, lastMonthExpenses);
  
  // Composite score (0-100)
  const score = Math.min(100, Math.max(0,
    30 * Math.min(1, savingsRate / 30) + // Up to 30 points for savings
    25 * budgetAdherence +               // Up to 25 points for budget adherence
    25 * goalProgress +                  // Up to 25 points for goal progress
    20 * expenseControl                  // Up to 20 points for expense control
  ));
  
  return {
    score: Math.round(score),
    savingsRate: Math.round(savingsRate),
    budgetAdherence: Math.round(budgetAdherence * 100),
    goalProgress: Math.round(goalProgress * 100),
    expenseControl: Math.round(expenseControl * 100),
    netIncome: currentIncome - currentExpenses,
    incomeChange: calculatePercentageChange(currentIncome, lastMonthIncome),
    spendingChange: calculatePercentageChange(currentExpenses, lastMonthExpenses)
  };
}

// Helper to calculate budget adherence (0-1)
async function calculateBudgetAdherence(userId, currentExpenses) {
  // In a real app, this would check against user-defined budgets
  // For now, we'll use a simple heuristic based on income
  const primaryAc = await Account.findOne({ userId, isPrimary: true });
  const accountId = primaryAc.accountId;
  
  const now = moment();
  const monthStart = now.clone().startOf('month');
  
  const currentIncome = await Transaction.aggregate([
    { 
      $match: { 
        userId,
        accountId,
        type: 'income',
        date: { $gte: monthStart.toDate() }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const income = currentIncome[0]?.total || 0;
  const recommendedBudget = income * 0.7; // Assuming 70% of income is reasonable
  
  if (currentExpenses <= recommendedBudget) return 1;
  if (currentExpenses >= income) return 0;
  
  return 1 - ((currentExpenses - recommendedBudget) / (income - recommendedBudget));
}

// Helper to calculate goal progress (0-1)
async function calculateGoalProgress(userId) {
  const goals = await Goal.find({ userId, status: 'active' });
  if (goals.length === 0) return 0; // Neutral if no goals
  
  const totalProgress = goals.reduce((sum, goal) => {
    return sum + (goal.currentAmount / goal.targetAmount);
  }, 0);
  
  return totalProgress / goals.length;
}

// Helper to calculate expense control (0-1)
function calculateExpenseControl(currentExpenses, lastMonthExpenses) {
  if (lastMonthExpenses === 0) return 1; // No previous spending
  
  const change = currentExpenses / lastMonthExpenses;
  
  if (change <= 0.9) return 1;       // Spending decreased >10%
  if (change <= 1.0) return 0.8;     // Spending decreased 0-10%
  if (change <= 1.1) return 0.6;     // Spending increased 0-10%
  if (change <= 1.3) return 0.4;     // Spending increased 10-30%
  return 0;                          // Spending increased >30%
}

// Helper to calculate percentage change
function calculatePercentageChange(current, previous) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Get category insights with additional metrics
async function getCategoryInsights(userId) {
  const primaryAc = await Account.findOne({ userId, isPrimary: true });
  if (!primaryAc) throw new Error('Primary account not found');
  
  const accountId = primaryAc.accountId;
  const monthStart = moment().startOf('month');
  
  return Transaction.aggregate([
    { 
      $match: { 
        userId,
        accountId,
        type: 'expense',
        date: { $gte: monthStart.toDate() }
      } 
    },
    {
      $group: {
        _id: '$category.primary',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        lastTransaction: { $last: '$date' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 6 }
  ]);
}

// Helper function to generate insights
async function generateInsights(userId, period) {
  const startDate = moment().subtract(1, period === 'weekly' ? 'week' : 'month').startOf('day');
  const endDate = moment().endOf('day');

  const primaryAc = await Account.findOne({userId : userId, isPrimary: true});
  if (!primaryAc) throw new Error('Primary account not found');
  
  const accountId = primaryAc.accountId;

  // Get transactions for the period
  const transactions = await Transaction.find({
    userId,
    accountId: accountId,
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

  const prevIncomeTransactions = await Transaction.find({
    userId,
    date: { $gte: prevStartDate.toDate(), $lte: prevEndDate.toDate() },
    type: 'income'
  });

  const prevTotalIncome = prevIncomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const incomeChange = ((totalIncome - prevTotalIncome) / (prevTotalIncome || 1)) * 100;

  const prevTotalExpenses = prevTransactions.reduce((sum, t) => sum + t.amount, 0);
  const spendingChange = ((totalExpenses - prevTotalExpenses) / (prevTotalExpenses || 1)) * 100;

  const netIncome = totalIncome - totalExpenses;
  const prevNetIncome = prevTotalIncome - prevTotalExpenses;
  const balanceChange = ((netIncome - prevNetIncome) / (prevNetIncome || 1)) * 100;

  return {
    period,
    totalExpenses,
    totalIncome,
    netIncome,
    incomeChange: Math.round(incomeChange * 100) / 100,
    spendingChange: Math.round(spendingChange * 100) / 100,
    balanceChange: Math.round(balanceChange * 100) / 100,
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
      message: `You spent ₹${amount.toFixed(2)} on ${category} this month. Consider setting a budget limit for this category.`,
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

// Get Monthly income and expense trends for chart for last 6 months
router.get('/income-expense-trends', authMiddleware, async (req, res) => {
  try {
    const monthsToInclude = 6; // Last 6 months
    const trends = [];

    const primaryAc = await Account.findOne({ userId: req.user._id, isPrimary: true });
    if (!primaryAc) return res.status(400).json({ message: 'Primary account not found' });

    const accountId = primaryAc.accountId;

    for (let i = monthsToInclude - 1; i >= 0; i--) {
      const start = moment().subtract(i, 'months').startOf('month');
      const end = moment().subtract(i, 'months').endOf('month');

      const transactions = await Transaction.find({
        userId: req.user._id,
        accountId,
        date: { $gte: start.toDate(), $lte: end.toDate() }
      });

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      trends.push({
        month: start.format('MMM'),
        income,
        expenses
      });
    }

    res.json(trends);
  } catch (err) {
    console.error('Error generating monthly income-expense trends:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Helper function to generate insights
async function generateInsights(userId, period) {
  const startDate = moment().subtract(1, period === 'weekly' ? 'week' : 'month').startOf('day');
  const endDate = moment().endOf('day');

  //for the users specific primary account
  const primaryAc = await Account.findOne({userId : userId,isPrimary : true})

  if(!primaryAc) return "You have no active accounts Please Add Your Bank Account"
  
    const accountId = primaryAc.accountId

  // Get transactions for the period
  const transactions = await Transaction.find({
    userId,
    accountId : accountId,
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

  const prevIncomeTransactions = await Transaction.find({
  userId,
  date: { $gte: prevStartDate.toDate(), $lte: prevEndDate.toDate() },
  type: 'income'
});

//for income change
const prevTotalIncome = prevIncomeTransactions.reduce((sum, t) => sum + t.amount, 0);
 
const incomeChange = ((totalIncome - prevTotalIncome) / (prevTotalIncome || 1)) * 100;

//for spending change
  const prevTotalExpenses = prevTransactions.reduce((sum, t) => sum + t.amount, 0);
  const spendingChange = ((totalExpenses - prevTotalExpenses) / (prevTotalExpenses || 1)) * 100;

  //change in balances

  const netIncome = totalIncome - totalExpenses

  const prevNetIncome = prevTotalIncome - prevTotalExpenses;
  const balanceChange = ((netIncome - prevNetIncome) / (prevNetIncome || 1)) * 100;

  //savings change
  const savingsChange = ((netIncome - prevNetIncome) / (Math.abs(prevNetIncome) || 1)) * 100;


  return {
    period,
    totalExpenses,
    totalIncome,
    netIncome,
    incomeChange: Math.round(incomeChange * 100) / 100,
    spendingChange: Math.round(spendingChange * 100) / 100,
    balanceChange: Math.round(balanceChange * 100) / 100,
    savingsChange : Math.round(balanceChange * 100) / 100,
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
      message: `You spent ₹${amount.toFixed(2)} on ${category} this month. Consider setting a budget limit for this category.`,
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