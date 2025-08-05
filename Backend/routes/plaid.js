
const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const indianBanks = require('../services/mockBanks');
const router = express.Router();


// Create link token
router.post('/create-link-token', authMiddleware, async (req, res) => {
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
router.post('/exchange-public-token', authMiddleware, async (req, res) => {
  try {
    const { public_token, bank_id, branch_id, user_credentials } = req.body;

    const response = exchangeToken( public_token,
      bank_id,
      branch_id,
      user_credentials)

    const { access_token, item_id } = response;

    // Save access token to user
    await User.findByIdAndUpdate(req.user._id, {
      plaidAccessToken: access_token,
      plaidItemId: item_id,
      bankId: bank_id,
      branchId: branch_id
    });


    res.json({ message: 'Bank account linked successfully' });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ message: 'Error linking bank account' });
  }
});


function exchangeToken(public_token, bank_id, branch_id, user_credentials) {
        
  try {
      
      const accessToken = `access_token_${uuidv4()}`;
      const itemId = `item_${uuidv4()}`;
      
      // Create mock accounts for the user
      const bank = indianBanks.find(b => b.id === bank_id);
      if (!bank) {
        return { message: 'Invalid bank selected' };
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
      
      
      return({
        access_token: accessToken,
        item_id: itemId,
        accounts
      });
    } catch (error) {
      console.error('Error exchanging public token:', error);
      res.status(500).json({ message: 'Error linking bank account' });
    }
  
}

module.exports = router;
