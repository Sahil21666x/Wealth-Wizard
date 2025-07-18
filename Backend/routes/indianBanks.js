const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Account = require('../models/Account');

const router = express.Router();


// Indian Banks API base URL
const INDIAN_BANKS_API_BASE = process.env.INDIAN_BANKS_API_URL || 'http://localhost:5001/api';

// Get all banks
router.get('/banks', async (req, res) => {
  try {
    const response = await axios.get(`${INDIAN_BANKS_API_BASE}/banks`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching banks:', error);

    // Return fallback data if API is not available
    console.log('IndianBanksAPI service not available, returning fallback data');
    res.json([
      { id: 'sbi', name: 'State Bank of India', code: 'SBIN' },
      { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
      { id: 'icici', name: 'ICICI Bank', code: 'ICIC' },
      { id: 'axis', name: 'Axis Bank', code: 'UTIB' },
      { id: 'pnb', name: 'Punjab National Bank', code: 'PUNB' },
      { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KKBK' }
    ]);
  }
});

//get accounts

router.get('/accounts',authMiddleware, async(req,res)=>{
       try {
    const userId = req.user._id; // Assuming auth middleware attaches user

    const accounts = await Account.find({ userId });

    res.status(200).json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts. Please try again later.',
    });
  }
})

// Get bank branches
router.get('/banks/:bankId/branches', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${INDIAN_BANKS_API_BASE}/banks/${req.params.bankId}/branches`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ message: 'Error fetching branches' });
  }
});

// Search banks
router.get('/banks/search/:query', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${INDIAN_BANKS_API_BASE}/banks/search/${req.params.query}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error searching banks:', error);
    res.status(500).json({ message: 'Error searching banks' });
  }
});

//add bank account

router.post('/add-linked-accounts',authMiddleware, async (req, res) => {
  try {
    const { bankName, accountNumber, accountType, ifsc, accountHolderName } = req.body;
    console.log(req.body,"body");
    
    const userId = req.user._id; // assuming user is attached via middleware

    // Check if the account is already added by this user
    const existingAccount = await Account.findOne({
      userId,
      accountNumber,
      bankName,
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'This bank account is already linked to your profile.',
      });
    }
 //Mockingly adding balances
   const balances= {
          available: Math.floor(Math.random() * 100000) + 10000,
          current: Math.floor(Math.random() * 100000) + 10000
        }

    const newAccount = new Account({
      userId,
      bankName,
      accountNumber,
      accountType,
      ifsc,
      accountHolderName,
      balances,
    });

    await newAccount.save();

    res.status(201).json({
      success: true,
      message: 'Account linked successfully',
      account: newAccount,
    });
  } catch (error) {
    console.error('Error adding account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add account. Please try again later.',
    });
  }
});

//remove Bank Account

router.post('/users/removeBankAccount', async(req,res)=>{
          try {
    const userId = req.user.id;
    const { accountId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.linkedAccounts = user.linkedAccounts.filter(acc => acc.accountId !== accountId);

    await user.save();

    res.status(200).json({ message: 'Bank account removed successfully', accounts: user.linkedAccounts });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
})


module.exports = router;