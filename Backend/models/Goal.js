
const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  targetAmount: {
    type: Number,
    required: true,
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  monthlyContribution: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    enum: ["Emergency", "Travel", "Transportation", "Housing", "Education", "Investment","Vacation", "Retirement", "Other"],
    required: true,
  },
  targetDate: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active',
  },
  autoContribute: {
    enabled: { type: Boolean, default: false },
    amount: Number,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'monthly',
    },
  },

  milestones: [{
    amount: Number,
    achieved: { type: Boolean, default: false },
    achievedDate: Date,
  }],
  transactions: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['contribution', 'withdrawal'],
      default: 'contribution',
    },
    description: String,
  }],
}, {
  timestamps: true,
});

goalSchema.virtual('progressPercentage').get(function() {
  return Math.min(Math.round((this.currentAmount / this.targetAmount) * 100), 100);
});

goalSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
