
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const indianBanks = require('../data/banks');

// Mock user accounts storage (in production, use a database)
const mockAccounts = {};

// Create link token
router.post('/create-link-token', (req, res) => {
  try {
    const linkToken = `link_token_${uuidv4()}`;
    res.json({
      link_token: linkToken,
      expiration: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ message: 'Error creating link token' });
  }
});

// Exchange public token for access token
router.post('/exchange-public-token', (req, res) => {
  try {
    const { public_token, bank_id, branch_id, user_credentials } = req.body;
    
    const accessToken = `access_token_${uuidv4()}`;
    const itemId = `item_${uuidv4()}`;
    
    // Create mock accounts for the user
    const bank = indianBanks.find(b => b.id === bank_id);
    if (!bank) {
      return res.status(400).json({ message: 'Invalid bank selected' });
    }
    
    const accounts = [
      {
        account_id: `acc_${uuidv4()}`,
        name: 'Savings Account',
        type: 'depository',
        subtype: 'savings',
        bank_name: bank.name,
        branch_id: branch_id,
        balances: {
          available: Math.floor(Math.random() * 100000) + 10000,
          current: Math.floor(Math.random() * 100000) + 10000
        }
      },
      {
        account_id: `acc_${uuidv4()}`,
        name: 'Current Account',
        type: 'depository',
        subtype: 'checking',
        bank_name: bank.name,
        branch_id: branch_id,
        balances: {
          available: Math.floor(Math.random() * 50000) + 5000,
          current: Math.floor(Math.random() * 50000) + 5000
        }
      }
    ];
    
    // Store mock accounts
    mockAccounts[accessToken] = {
      accounts,
      bank_id,
      branch_id,
      item_id: itemId
    };
    
    res.json({
      access_token: accessToken,
      item_id: itemId,
      accounts
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ message: 'Error linking bank account' });
  }
});

// Get accounts
router.post('/get-accounts', (req, res) => {
  try {
    const { access_token } = req.body;
    
    const userAccounts = mockAccounts[access_token];
    if (!userAccounts) {
      return res.status(400).json({ message: 'Invalid access token' });
    }
    
    res.json({ accounts: userAccounts.accounts });
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
