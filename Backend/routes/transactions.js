
const express = require('express');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const aiService = require('../services/aiService');
const Account = require('../models/Account');

const router = express.Router();

// Get all transactions for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, category, type, startDate, endDate } = req.query;

    // console.log(accountId);

    const userId =  req.user._id

    const query = { userId: userId };

    const primaryAc = await Account.findOne({userId : userId,isPrimary : true})

    if(!primaryAc) return res.status(400).json({message : "You have no active accounts Please Add Your Bank Account"})

    const accountId = primaryAc.accountId

    if(accountId) {
      query.accountId = accountId
    }else { 
      res.status(400).json({ message: 'Please Provide Account to fetch Transactions' });
      return;
     }
    
    // Add filters
    if (category) query['category.primary'] = category;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add manual transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { amount, description, category, type, date, merchant } = req.body;

    const userId = req.user._id
  
    const primaryAc = await Account.findOne({userId : userId,isPrimary : true})

    if(!primaryAc) return res.status(400).json({message : "You have no active accounts Please Add Your Bank Account"})

    const accountId = primaryAc.accountId

  
    const transaction = new Transaction({
      userId: req.user._id,
      accountId: accountId,
      amount: Math.abs(amount),
      date: new Date(date),
      description,
      category,
      merchant,
      type
    });

    await transaction.save();

    const account = primaryAc
    
    let balance =account.balances.current 
    if(type==="expense"){
      balance-= amount
    }else balance+=amount

    account.balances.current = balance
     await account.save()

    res.status(201).json({ message: 'Transaction created successfully', transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction 
router.put('/:id', authMiddleware, async (req, res) => {
  try {   
    const updatedFields = req.body;
    
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.body._id, userId: req.user._id },
      updatedFields,
      { new: true }
    );
     

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction updated successfully', transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction 
router.delete('/:id', authMiddleware, async (req, res) => {
  try {   
    const transactionId = req.params.id;
    
    const transaction = await Transaction.findByIdAndDelete(
      { _id: transactionId, userId: req.user._id }
    );
     

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully', transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get spending by category
router.get('/analytics/spending-by-category', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { 
      userId: req.user._id,
      type: 'expense'
    };
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const result = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category.primary',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json(result);
  } catch (error) {
    console.error('Error getting spending by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Detect anomalies
router.post('/detect-anomalies', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      userId: req.user._id 
    }).sort({ date: -1 }).limit(100);

    const anomalies = await aiService.detectAnomalies(transactions);
    
    // Update transactions with anomaly flags
    for (const anomaly of anomalies) {
      await Transaction.findByIdAndUpdate(anomaly.id, { 
        isAnomalous: true,
        confidence: anomaly.confidence 
      });
    }

    res.json({ 
      message: 'Anomaly detection completed',
      anomalies: anomalies.length
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length
    });
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


//manually updating accountId of all sample transactions to connect accounts to transactions
router.post("/updateAllTransactions", async(req,res)=>{

  try {
    const result = await Transaction.updateMany(
      {}, // Empty filter = all documents
      {
        $set: {
          accountId: 'a349777a-0e77-45d8-9b29-267ac2cd27dc'
        }
      }
    );

    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    if(result){ 
      res
    .status(200)
    .json({sucsess : true,msg :"updateded All the documents"})
    }
  } catch (err) {
    console.error('Error:', err);
  }

})

module.exports = router;
