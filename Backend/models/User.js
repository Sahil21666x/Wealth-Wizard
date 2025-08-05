const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  profile: {
    avatar: String,
    phone: String,
    dateOfBirth: Date,
    occupation: String,
  },
  preferences: {
    currency: {
      type: String,
      default: 'INR',
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      budgetAlerts: { type: Boolean, default: true },
      goalReminders: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: false },
      monthlyReports: { type: Boolean, default: true },
    },
    privacy: {
      dataSharing: { type: Boolean, default: false },
      analyticsTracking: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
    },
  },
  hasLinkedAccounts: {
  type: Boolean,
  default: false,
}
,
pushSubscription: {
  endpoint: String,
  keys: {
    p256dh: String,
    auth: String
  }
}

  // gamification: {
  //   totalPoints: { type: Number, default: 0 },
  //   level: { type: Number, default: 1 },
  //   badges: [String],
  //   streaks: {
  //     currentSavingStreak: { type: Number, default: 0 },
  //     longestSavingStreak: { type: Number, default: 0 },
  //     budgetAdherenceStreak: { type: Number, default: 0 },
  //   },
  //   challenges: [{
  //     id: String,
  //     title: String,
  //     description: String,
  //     type: String,
  //     target: Number,
  //     progress: { type: Number, default: 0 },
  //     completed: { type: Boolean, default: false },
  //     startDate: Date,
  //     endDate: Date,
  //     reward: Number,
  //   }],
  // },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);