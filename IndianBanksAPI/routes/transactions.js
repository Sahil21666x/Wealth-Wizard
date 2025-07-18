
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mock transaction categories for Indian context
const indianCategories = [
  { primary: 'Food & Dining', detailed: ['Restaurants', 'Groceries', 'Street Food', 'Swiggy/Zomato'] },
  { primary: 'Transportation', detailed: ['Uber/Ola', 'Petrol', 'Auto Rickshaw', 'Metro/Bus'] },
  { primary: 'Shopping', detailed: ['Amazon', 'Flipkart', 'Local Markets', 'Clothing'] },
  { primary: 'Bills & Utilities', detailed: ['Electricity', 'Mobile Recharge', 'Internet', 'DTH'] },
  { primary: 'Entertainment', detailed: ['Movies', 'Netflix', 'Gaming', 'Events'] },
  { primary: 'Healthcare', detailed: ['Doctor Fees', 'Medicines', 'Lab Tests', 'Insurance'] },
  { primary: 'Education', detailed: ['Course Fees', 'Books', 'Online Courses', 'Tuition'] },
  { primary: 'Income', detailed: ['Salary', 'Freelancing', 'Business', 'Investments'] }
];

// Mock Indian merchants
const indianMerchants = [
  'Reliance Fresh', 'Big Bazaar', 'DMart', 'Spencer\'s', 'More Supermarket',
  'McDonald\'s India', 'KFC India', 'Pizza Hut', 'Domino\'s', 'Subway',
  'Café Coffee Day', 'Starbucks India', 'Barista', 'Chaayos',
  'BookMyShow', 'PVR Cinemas', 'INOX', 'Carnival Cinemas',
  'Jio', 'Airtel', 'Vi (Vodafone Idea)', 'BSNL',
  'IRCTC', 'MakeMyTrip', 'Goibibo', 'Cleartrip',
  'Apollo Pharmacy', 'MedPlus', 'Netmeds', '1mg',
  'Petrol Pump', 'HP Petrol', 'Indian Oil', 'Bharat Petroleum'
];

// Generate mock transactions
function generateMockTransactions(days = 30) {
  const transactions = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let i = 0; i < days * 2; i++) { // 2 transactions per day on average
    const randomDate = new Date(startDate.getTime() + Math.random() * (Date.now() - startDate.getTime()));
    const randomCategory = indianCategories[Math.floor(Math.random() * indianCategories.length)];
    const randomMerchant = indianMerchants[Math.floor(Math.random() * indianMerchants.length)];
    const isIncome = randomCategory.primary === 'Income';
    
    let amount;
    if (isIncome) {
      amount = -(Math.floor(Math.random() * 50000) + 25000); // Negative for income in Plaid format
    } else {
      amount = Math.floor(Math.random() * 2000) + 50; // Positive for expenses
    }
    
    const transaction = {
      transaction_id: `txn_${uuidv4()}`,
      account_id: `acc_${uuidv4()}`,
      amount: amount,
      date: randomDate.toISOString().split('T')[0],
      name: randomMerchant,
      merchant_name: randomMerchant,
      category: [randomCategory.primary, randomCategory.detailed[0]],
      subcategory: randomCategory.detailed[Math.floor(Math.random() * randomCategory.detailed.length)],
      type: isIncome ? 'income' : 'expense',
      pending: Math.random() < 0.1, // 10% chance of pending
      location: {
        address: `${Math.floor(Math.random() * 999) + 1}, Sample Street`,
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad'][Math.floor(Math.random() * 7)],
        region: 'IN',
        postal_code: `${Math.floor(Math.random() * 900000) + 100000}`,
        country: 'IN'
      }
    };
    
    transactions.push(transaction);
  }
  
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Get transactions
router.post('/get-transactions', (req, res) => {
  try {
    const { access_token, start_date, end_date, count = 50 } = req.body;
    
    // Generate mock transactions
    const transactions = generateMockTransactions(30);
    
    // Filter by date range if provided
    let filteredTransactions = transactions;
    if (start_date || end_date) {
      filteredTransactions = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        if (start_date && txnDate < new Date(start_date)) return false;
        if (end_date && txnDate > new Date(end_date)) return false;
        return true;
      });
    }
    
    // Limit results
    filteredTransactions = filteredTransactions.slice(0, count);
    
    res.json({
      transactions: filteredTransactions,
      total_transactions: filteredTransactions.length,
      accounts: [
        {
          account_id: 'acc_sample',
          name: 'Primary Savings',
          type: 'depository',
          subtype: 'savings'
        }
      ]
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync transactions (for periodic updates)
router.post('/sync', (req, res) => {
  try {
    const { access_token } = req.body;
    
    // Generate new transactions (simulate new activity)
    const newTransactions = generateMockTransactions(7); // Last 7 days
    
    res.json({
      new_transactions: newTransactions.length,
      transactions: newTransactions,
      message: 'Transactions synced successfully'
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
