// models/Account.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transaction_id: String,
  account_id: String,
  user_id: mongoose.Schema.Types.ObjectId,
  amount: Number,
  date: String,
  name: String,
  merchant_name: String,
  category: [String],
  subcategory: String,
  type: String,
  pending: Boolean,
  location: {
    address: String,
    city: String,
    region: String,
    postal_code: String,
    country: String
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
