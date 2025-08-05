
const express = require('express');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

const router = express.Router();

// Send weekly reports to all users
router.post('/weekly-reports', async (req, res) => {
  try {
    const users = await User.find({ 'preferences.notifications.weeklyReports': true });
    
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await notificationService.sendPeriodicReport(user._id, 'weekly');
        successCount++;
      } catch (error) {
        console.error(`Error sending weekly report to user ${user._id}:`, error);
        errorCount++;
      }
    }

    res.json({
      message: 'Weekly reports sent',
      successCount,
      errorCount,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('Error sending weekly reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send monthly reports to all users
router.post('/monthly-reports', async (req, res) => {
  try {
    const users = await User.find({ 'preferences.notifications.monthlyReports': true });
    
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await notificationService.sendPeriodicReport(user._id, 'monthly');
        successCount++;
      } catch (error) {
        console.error(`Error sending monthly report to user ${user._id}:`, error);
        errorCount++;
      }
    }

    res.json({
      message: 'Monthly reports sent',
      successCount,
      errorCount,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('Error sending monthly reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Analyze and send insights for all users
router.post('/analyze-insights', async (req, res) => {
  try {
    const users = await User.find({ 'preferences.notifications.weeklyReports': true });
    
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await notificationService.analyzeAndNotify(user._id);
        successCount++;
      } catch (error) {
        console.error(`Error analyzing insights for user ${user._id}:`, error);
        errorCount++;
      }
    }

    res.json({
      message: 'Insights analysis completed',
      successCount,
      errorCount,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('Error analyzing insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send manual insight notification for current user
router.post('/send-insight', authMiddleware, async (req, res) => {
  try {
    const { type, data } = req.body;
    
    await notificationService.sendInsightsNotification(req.user._id, type, data);
    
    res.json({ message: 'Insight notification sent successfully' });
  } catch (error) {
    console.error('Error sending insight notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's notification history (if you want to track sent notifications)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    // This would require a NotificationHistory model to track sent notifications
    // For now, just return a placeholder response
    res.json({
      notifications: [],
      message: 'Notification history feature coming soon'
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;