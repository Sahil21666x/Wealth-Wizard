const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountNumber: String,
  accountId: {
      type: String,
      required : true
  },
  ifsc: String,
  bankName: String,
  type: String,         // savings, current, etc.
  holderName: String,
  balances: {
    available: Number,
    current: Number,
    lastUpdated: Date
  },
  aadhaarLinked: Boolean,
  consentId: String,
  aaName: String,       // Finvu, Setu If i can get access ill have to add here etc.
  rawData: mongoose.Schema.Types.Mixed,
  isPrimary: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
