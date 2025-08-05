
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const User = require('../models/User');
const axios = require('axios');

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = process.env.OPENAI_API_URL;


// AI Chat endpoint
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    // Fetch user's financial data
    const [transactions, goals, user] = await Promise.all([
      Transaction.find({ userId }).sort({ date: -1 }).limit(50),
      Goal.find({ userId }),
      User.findById(userId)
    ]);

    // Generate financial context
    const financialContext = await generateFinancialContext(transactions, goals, user);
    
    // Generate AI response
    let aiResponse;
    
    if (OPENAI_API_KEY) {
      // Use OpenAI API
      aiResponse = await generateOpenAIResponse(message, financialContext);
    } else {
      // Fallback to rule-based responses
      aiResponse = generateRuleBasedResponse(message, financialContext);
    }

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    });
  }
});

// Generate financial context from user data
async function generateFinancialContext(transactions, goals, user) {
  const context = {
    totalTransactions: transactions.length,
    recentTransactions: transactions.slice(0, 10),
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.status === 'active'),
    completedGoals: goals.filter(g => g.status === 'completed'),
    userName: user.firstName || 'there'
  };

  // Calculate spending by category
  const categorySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category?.primary || t.category || 'Other';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {});

  context.topSpendingCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Calculate monthly totals
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthTransactions = transactions.filter(t => new Date(t.date) >= thisMonth);
  
  context.thisMonthIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  context.thisMonthExpenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return context;
}

// Generate response using OpenAI API
async function generateOpenAIResponse(userMessage, context) {
  try {
    const systemPrompt = `You are a helpful financial assistant for ${context.userName}. 

User's Financial Summary:
- Total transactions: ${context.totalTransactions}
- Active goals: ${context.activeGoals.length}
- Completed goals: ${context.completedGoals.length}
- This month's income: ₹${context.thisMonthIncome}
- This month's expenses: ₹${context.thisMonthExpenses}
- Top spending categories: ${context.topSpendingCategories.map(([cat, amt]) => `${cat}: ₹${amt}`).join(', ')}

Recent transactions:
${context.recentTransactions.slice(0, 5).map(t => 
  `- ${t.description}: ₹${t.amount} (${t.type}) - ${t.category?.primary || 'Other'}`
).join('\n')}

Active goals:
${context.activeGoals.map(g => 
  `- ${g.title}: ₹${g.currentAmount}/₹${g.targetAmount} (${Math.round((g.currentAmount/g.targetAmount)*100)}%)`
).join('\n')}

Provide personalized, helpful financial advice based on this data. Be conversational, supportive, and specific to their situation. Keep responses concise (2-3 sentences max).`;

    const response = await axios.post(OPENAI_API_URL, {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw error;
  }
}

// Fallback rule-based response generator
function generateRuleBasedResponse(userMessage, context) {
  const lowerInput = userMessage.toLowerCase();
  const { userName, thisMonthIncome, thisMonthExpenses, topSpendingCategories, activeGoals } = context;

  if (lowerInput.includes('budget') || lowerInput.includes('spending')) {
    const topCategory = topSpendingCategories[0];
    if (topCategory) {
      return `Hi ${userName}! I see you've spent ₹${topCategory[1]} on ${topCategory[0]} recently. Consider setting a monthly budget for this category to better track your expenses.`;
    }
    return `Hi ${userName}! Based on your transactions, I'd recommend creating category-wise budgets to better manage your spending.`;
  }
  
  if (lowerInput.includes('save') || lowerInput.includes('goal')) {
    if (activeGoals.length > 0) {
      const goal = activeGoals[0];
      const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
      return `Great question, ${userName}! You're ${progress}% towards your "${goal.title}" goal. Based on your current income of ₹${thisMonthIncome}, you could potentially save more by optimizing your ${topSpendingCategories[0]?.[0] || 'spending'}.`;
    }
    return `Hi ${userName}! I notice you don't have any active savings goals. Based on your income of ₹${thisMonthIncome}, consider setting up an emergency fund goal first.`;
  }
  
  if (lowerInput.includes('expense') || lowerInput.includes('cost')) {
    const netIncome = thisMonthIncome - thisMonthExpenses;
    return `This month you've spent ₹${thisMonthExpenses} against an income of ₹${thisMonthIncome}, giving you a net of ₹${netIncome}. ${netIncome > 0 ? 'Great job staying positive!' : 'Consider reviewing your expenses.'}`;
  }
  
  if (lowerInput.includes('income')) {
    return `Your income this month is ₹${thisMonthIncome}. ${thisMonthIncome > thisMonthExpenses ? `You're doing well with ₹${thisMonthIncome - thisMonthExpenses} left after expenses!` : 'Consider ways to increase income or reduce expenses.'}`;
  }

  // Default personalized response
  return `Hi ${userName}! I can help you with your finances. You have ${context.totalTransactions} transactions and ${activeGoals.length} active goals. Ask me about budgeting, savings, or your spending patterns!`;
}

module.exports = router;