
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plaidTransactionId: String,
  accountId: String,
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
 category: {
  primary: {
    type: String,
    required: true,
    enum: [
      "Food & Dining",
      "Transportation",
      "Shopping",
      "Bills & Utilities",
      "Entertainment",
      "Healthcare",
      "Education",
      "Income",
      "Other"
    ],
  },
  detailed: String,
  icon: String,
}
,
  merchant: {
    name: String,
    logo: String,
  },
  location: {
    address: String,
    city: String,
    region: String,
    postalCode: String,
    country: String,
    lat: Number,
    lon: Number,
  },
  paymentMeta: {
    paymentMethod: String,
    paymentProcessor: String,
    ppd_id: String,
    reason: String,
    reference_number: String,
  },
  pending: {
    type: Boolean,
    default: false,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  notes: String,
}, {
  timestamps: true,
});

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, 'category.primary': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
