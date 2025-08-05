const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["https://wealth-wizard-omega.vercel.app", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/financeai', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const goalRoutes = require('./routes/goals');
const insightRoutes = require('./routes/insights');
const bankRoutes = require('./routes/plaid')
const notificationRoutes = require('./routes/notifications');
const aiChatRoutes = require('./routes/aiChatBot')

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/plaid', bankRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/indian-banks', require('./routes/indianBanks'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiChatRoutes);



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Scheduled tasks for insights generation
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily insights generation...');
  // This would trigger insights generation for all users
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://0.0.0.0:${PORT}/api`);
  console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
});