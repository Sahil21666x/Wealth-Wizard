const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Account = require('../models/Account');
const indianBanks = require('../services/mockBanks');

const router = express.Router();

// Get all banks
router.get('/banks', async (req, res) => {
  try {
    const banks = indianBanks.map(bank => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      type: bank.type,
      logo: bank.logo
    }));
    res.json(banks);
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

router.get('/accounts', authMiddleware, async (req, res) => {
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
    const bank = indianBanks.find(b => b.id === req.params.bankId);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    res.json({ branches: bank.branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ message: 'Error fetching branches' });
  }
});

// Search banks
router.get('/banks/search/:query', authMiddleware, async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const filteredBanks = indianBanks.filter(bank =>
      bank.name.toLowerCase().includes(query) ||
      bank.code.toLowerCase().includes(query)
    ).map(bank => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      type: bank.type,
      logo: bank.logo
    }));

    res.json({ banks: filteredBanks });
  } catch (error) {
    console.error('Error searching banks:', error);
    res.status(500).json({ message: 'Error searching banks' });
  }
});

//add bank account

router.post('/add-linked-accounts', authMiddleware, async (req, res) => {
  try {
    const { bankName, accountNumber, accountType, ifsc, accountHolderName, accountId, isPrimary } = req.body;

    const userId = req.user._id;

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
    const balances = {
      available: Math.floor(Math.random() * 100000) + 10000,
      current: Math.floor(Math.random() * 100000) + 10000
    }

    const newAccount = new Account({
      userId,
      bankName,
      accountId,
      isPrimary,
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

router.post('/users/removeBankAccount/:accountId', async (req, res) => {
  try {

    const accountId = req.params.accountId;


    const accDeleted = await Account.deleteOne({ accountId: accountId })
    if (!accDeleted) return res.status(404).json({ message: 'User not found' });


    res.status(200).json({ message: 'Bank account removed successfully', account: accDeleted });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
})

router.post("/setPrimary", authMiddleware, async (req, res) => {
  try {
    const accountId = req.body.accountId;
    const userId = req.user._id;

    // console.log(req.body, "body");


    // Step 1: Reset all accounts to not primary
    await Account.updateMany({ userId }, { $set: { isPrimary: false } });

    // Step 2: Set the selected account as primary
    const primaryAc = await Account.updateOne(
      { userId, accountId },
      { $set: { isPrimary: true } }
    );

    return res.status(200).json({ message: "Primary account set", primaryAc });
  } catch (err) {
    console.error("Set primary error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get('/getPrimary', authMiddleware, async (req, res) => {

  try {
    const userId = req.user._id

    const primaryAc = await Account.find({ userId: userId, isPrimary: true })

    if (!primaryAc) res.status(500).json({ message: "Internal server error" })

    res.json(primaryAc)

  } catch (err) {
    res.status(400).json({ message: "No primary Account Exists" })
  }
})

module.exports = router;