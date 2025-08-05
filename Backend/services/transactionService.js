//to generate Mock Transactions

const categoryMapping = {
  // Food & Dining
  'Food and Drink': ['restaurant', 'food', 'dining', 'cafe', 'bar', 'pizza', 'coffee', 'lunch', 'dinner'],
  'Groceries': ['grocery', 'supermarket', 'market', 'walmart', 'target', 'costco'],
  
  // Transportation
  'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'metro', 'bus', 'train', 'parking'],
  'Auto': ['auto', 'car', 'vehicle', 'mechanic', 'oil change', 'tire'],
  
  // Shopping
  'Shopping': ['amazon', 'store', 'retail', 'clothing', 'electronics', 'department'],
  
  // Bills & Utilities
  'Utilities': ['electric', 'gas', 'water', 'internet', 'phone', 'cable', 'utility'],
  'Rent': ['rent', 'mortgage', 'housing'],
  
  // Entertainment
  'Entertainment': ['movie', 'theater', 'netflix', 'spotify', 'game', 'entertainment'],
  
  // Healthcare
  'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medical', 'dentist', 'health'],
  
  // Financial
  'Banking': ['bank', 'atm', 'fee', 'transfer', 'payment'],
  'Investment': ['investment', 'trading', 'stock', 'mutual fund'],
  
  // Travel
  'Travel': ['hotel', 'airline', 'flight', 'vacation', 'travel', 'booking'],
  
  // Education
  'Education': ['school', 'university', 'tuition', 'education', 'course'],
  
  // Personal Care
  'Personal Care': ['salon', 'spa', 'gym', 'fitness', 'beauty', 'barber'],
  
  // Miscellaneous
  'Other': []
};

function categorizeTransaction(transaction) {
  const description = transaction.name.toLowerCase();
  const plaidCategories = transaction.category || [];
  
  // First, try to use Plaid's categorization
  if (plaidCategories.length > 0) {
    const primary = plaidCategories[0];
    const detailed = plaidCategories[plaidCategories.length - 1];
    
    // Map Plaid categories to our categories
    const mappedCategory = mapPlaidCategory(primary);
    
    return {
      primary: mappedCategory,
      detailed: detailed
    };
  }
  
  // Fallback to keyword-based categorization
  for (const [category, keywords] of Object.entries(categoryMapping)) {
    if (keywords.some(keyword => description.includes(keyword))) {
      return {
        primary: category,
        detailed: category
      };
    }
  }
  
  return {
    primary: 'Other',
    detailed: 'Miscellaneous'
  };
}

function mapPlaidCategory(plaidCategory) {
  const categoryMap = {
    'Food and Drink': 'Food and Drink',
    'Shops': 'Shopping',
    'Transportation': 'Transportation',
    'Payment': 'Banking',
    'Recreation': 'Entertainment',
    'Service': 'Personal Care',
    'Healthcare': 'Healthcare',
    'Travel': 'Travel',
    'Bank Fees': 'Banking',
    'Cash Advance': 'Banking',
    'Interest': 'Banking',
    'Rent and Utilities': 'Utilities'
  };
  
  return categoryMap[plaidCategory] || 'Other';
}

function calculateMonthlySpending(transactions) {
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const month = new Date(transaction.date).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = 0;
    }
    monthlyData[month] += transaction.amount;
  });
  
  return monthlyData;
}

function calculateCategorySpending(transactions) {
  const categoryData = {};
  
  transactions.forEach(transaction => {
    const category = transaction.category.primary;
    if (!categoryData[category]) {
      categoryData[category] = 0;
    }
    categoryData[category] += transaction.amount;
  });
  
  return categoryData;
}

module.exports = {
  categorizeTransaction,
  calculateMonthlySpending,
  calculateCategorySpending
};
const Transaction = require('../models/Transaction');

class TransactionService {
  // Categorize transaction automatically
  static categorizeTransaction(description, amount) {
    const desc = description.toLowerCase();
    
    // Simple rule-based categorization
    if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('food')) {
      return { primary: 'Food & Dining', secondary: 'Groceries' };
    }
    
    if (desc.includes('gas') || desc.includes('fuel') || desc.includes('exxon') || desc.includes('shell')) {
      return { primary: 'Transportation', secondary: 'Gas' };
    }
    
    if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('bar')) {
      return { primary: 'Food & Dining', secondary: 'Restaurants' };
    }
    
    if (desc.includes('amazon') || desc.includes('shopping') || desc.includes('retail')) {
      return { primary: 'Shopping', secondary: 'General' };
    }
    
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('subscription')) {
      return { primary: 'Entertainment', secondary: 'Subscriptions' };
    }
    
    if (desc.includes('electric') || desc.includes('water') || desc.includes('utility')) {
      return { primary: 'Bills & Utilities', secondary: 'Utilities' };
    }
    
    if (desc.includes('rent') || desc.includes('mortgage')) {
      return { primary: 'Home', secondary: 'Rent & Mortgage' };
    }
    
    if (desc.includes('salary') || desc.includes('payroll') || desc.includes('income')) {
      return { primary: 'Income', secondary: 'Salary' };
    }
    
    // Default category
    return { primary: 'Other', secondary: 'Miscellaneous' };
  }

  // Process and save transactions
  static async processTransactions(userId, transactions) {
    const processedTransactions = [];
    
    for (const txn of transactions) {
      try {
        // Check if transaction already exists
        const existingTxn = await Transaction.findOne({
          userId,
          accountId: txn.account_id,
          transactionId: txn.transaction_id
        });
        
        if (existingTxn) {
          continue; // Skip if already exists
        }
        
        // Categorize transaction
        const category = this.categorizeTransaction(txn.name || txn.description, txn.amount);
        
        const transaction = new Transaction({
          userId,
          accountId: txn.account_id,
          transactionId: txn.transaction_id,
          amount: Math.abs(txn.amount),
          date: new Date(txn.date),
          description: txn.name || txn.description || 'Unknown',
          category,
          merchant: txn.merchant_name || null,
          type: txn.amount > 0 ? 'income' : 'expense'
        });
        
        await transaction.save();
        processedTransactions.push(transaction);
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    }
    
    return processedTransactions;
  }

  // Get spending summary
  static async getSpendingSummary(userId, startDate, endDate) {
    const matchStage = { userId };
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    
    const summary = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    return summary;
  }
}

module.exports = TransactionService;
