
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plaidTransactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  accountId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    primary: {
      type: String,
      required: true
    },
    detailed: {
      type: String,
      required: true
    }
  },
  merchant: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  isAnomalous: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
