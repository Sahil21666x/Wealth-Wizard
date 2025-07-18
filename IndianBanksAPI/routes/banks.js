
const express = require('express');
const router = express.Router();
const indianBanks = require('../data/banks');

// Get all banks
router.get('/', (req, res) => {
  try {
    const banks = indianBanks.map(bank => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      type: bank.type,
      logo: bank.logo
    }));
    res.json({ banks });
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bank by ID
router.get('/:bankId', (req, res) => {
  try {
    const bank = indianBanks.find(b => b.id === req.params.bankId);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    res.json({ bank });
  } catch (error) {
    console.error('Error fetching bank:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get branches for a bank
router.get('/:bankId/branches', (req, res) => {
  try {
    const bank = indianBanks.find(b => b.id === req.params.bankId);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    res.json({ branches: bank.branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search banks
router.get('/search/:query', (req, res) => {
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
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
