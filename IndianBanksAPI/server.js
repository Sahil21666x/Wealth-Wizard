
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/banks', require('./routes/banks'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/transactions', require('./routes/transactions'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Indian Banks API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Indian Banks API server running on port ${PORT}`);
});
