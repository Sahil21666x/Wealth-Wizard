
const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const transactionService = require('../services/transactionService');

const router = express.Router();

// Indian Banks API base URL
const INDIAN_BANKS_API_BASE = process.env.INDIAN_BANKS_API_URL || 'http://localhost:5001/api';

// Create link token
router.post('/create-link-token', authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(`${INDIAN_BANKS_API_BASE}/accounts/create-link-token`, {
      user_id: req.user._id.toString()
    });
    
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ message: 'Error creating link token' });
  }
});

// Exchange public token for access token
router.post('/exchange-public-token', authMiddleware, async (req, res) => {
  try {
    const { public_token, bank_id, branch_id, user_credentials } = req.body;

    const response = await axios.post(`${INDIAN_BANKS_API_BASE}/accounts/exchange-public-token`, {
      public_token,
      bank_id,
      branch_id,
      user_credentials
    });

    const { access_token, item_id } = response.data;

    // Save access token to user
    await User.findByIdAndUpdate(req.user._id, {
      plaidAccessToken: access_token,
      plaidItemId: item_id,
      bankId: bank_id,
      branchId: branch_id
    });

    // Fetch and store transactions
    await fetchAndStoreTransactions(req.user._id, access_token);

    res.json({ message: 'Bank account linked successfully' });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ message: 'Error linking bank account' });
  }
});

// Get accounts
router.get('/accounts', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.plaidAccessToken) {
      return res.json({ accounts: [] });
    }

    const response = await axios.post(`${INDIAN_BANKS_API_BASE}/accounts/get-accounts`, {
      access_token: user.plaidAccessToken
    });

    const accounts = response.data.accounts || [];
    
    // Add bank information to accounts
    const enhancedAccounts = accounts.map(account => ({
      ...account,
      bank_name: user.bankId ? `Bank ${user.bankId}` : 'Connected Bank',
      last_sync: new Date().toLocaleDateString()
    }));

    res.json({ accounts: enhancedAccounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Error fetching accounts' });
  }
});

// Sync transactions
router.post('/sync-transactions', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.plaidAccessToken) {
      return res.status(400).json({ message: 'No bank account linked' });
    }

    const newTransactions = await fetchAndStoreTransactions(req.user._id, user.plaidAccessToken);
    
    res.json({ 
      message: 'Transactions synced successfully',
      newTransactions: newTransactions.length
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({ message: 'Error syncing transactions' });
  }
});

// Helper function to fetch and store transactions
async function fetchAndStoreTransactions(userId, accessToken) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const endDate = new Date();

    const response = await axios.post(`${INDIAN_BANKS_API_BASE}/transactions/get-transactions`, {
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      count: 100
    });

    const transactions = response.data.transactions;
    const newTransactions = [];

    for (const transaction of transactions) {
      // Check if transaction already exists
      const existingTransaction = await Transaction.findOne({
        plaidTransactionId: transaction.transaction_id
      });

      if (!existingTransaction) {
        const newTransaction = new Transaction({
          userId,
          plaidTransactionId: transaction.transaction_id,
          accountId: transaction.account_id,
          amount: Math.abs(transaction.amount),
          date: new Date(transaction.date),
          description: transaction.name,
          category: {
            primary: transaction.category[0] || 'Other',
            detailed: transaction.subcategory || transaction.category[1] || 'General'
          },
          merchant: {
            name: transaction.merchant_name || transaction.name
          },
          location: transaction.location,
          type: transaction.amount > 0 ? 'expense' : 'income',
          pending: transaction.pending || false
        });

        await newTransaction.save();
        newTransactions.push(newTransaction);
      }
    }

    return newTransactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}


// Create link token (placeholder - requires Plaid credentials)
router.post('/link/token/create', authMiddleware, async (req, res) => {
  try {
    // This would normally create a Plaid link token
    // For now, return a mock response
    res.json({
      link_token: 'mock_link_token_for_development',
      expiration: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Exchange public token for access token
router.post('/link/token/exchange', authMiddleware, async (req, res) => {
  try {
    const { public_token } = req.body;
    
    // This would normally exchange the public token with Plaid
    // For now, return a mock response
    res.json({
      access_token: 'mock_access_token',
      item_id: 'mock_item_id'
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accounts
router.post('/accounts/get', authMiddleware, async (req, res) => {
  try {
    // Mock accounts data
    const accounts = [
      {
        account_id: 'mock_account_1',
        name: 'Checking Account',
        type: 'depository',
        subtype: 'checking',
        balances: {
          available: 2500.00,
          current: 2500.00
        }
      },
      {
        account_id: 'mock_account_2',
        name: 'Savings Account',
        type: 'depository',
        subtype: 'savings',
        balances: {
          available: 10000.00,
          current: 10000.00
        }
      }
    ];

    res.json({ accounts });
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
