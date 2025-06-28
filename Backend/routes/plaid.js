
const express = require('express');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const transactionService = require('../services/transactionService');

const router = express.Router();

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

// Create link token
router.post('/create-link-token', authMiddleware, async (req, res) => {
  try {
    const request = {
      user: {
        client_user_id: req.user._id.toString(),
      },
      client_name: 'Wealth Wizard',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    };

    const response = await client.linkTokenCreate(request);
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ message: 'Error creating link token' });
  }
});

// Exchange public token for access token
router.post('/exchange-public-token', authMiddleware, async (req, res) => {
  try {
    const { public_token } = req.body;

    const response = await client.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = response.data;

    // Save access token to user
    await User.findByIdAndUpdate(req.user._id, {
      plaidAccessToken: access_token,
      plaidItemId: item_id,
    });

    // Fetch and store transactions
    await fetchAndStoreTransactions(req.user._id, access_token);

    res.json({ message: 'Bank account linked successfully' });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ message: 'Error linking bank account' });
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

    const request = {
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };

    const response = await client.transactionsGet(request);
    const transactions = response.data.transactions;

    const newTransactions = [];

    for (const transaction of transactions) {
      // Check if transaction already exists
      const existingTransaction = await Transaction.findOne({
        plaidTransactionId: transaction.transaction_id
      });

      if (!existingTransaction) {
        const categorizedTransaction = transactionService.categorizeTransaction(transaction);
        
        const newTransaction = new Transaction({
          userId,
          plaidTransactionId: transaction.transaction_id,
          accountId: transaction.account_id,
          amount: Math.abs(transaction.amount),
          date: new Date(transaction.date),
          description: transaction.name,
          category: {
            primary: categorizedTransaction.primary,
            detailed: categorizedTransaction.detailed
          },
          merchant: transaction.merchant_name,
          type: transaction.amount > 0 ? 'expense' : 'income'
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

module.exports = router;
