
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const sendEmail = require('../services/emailService');
const sendPushNotification = require('../services/pushService');


const router = express.Router();

// Update notification settings
router.put('/notifications', authMiddleware, async (req, res) => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      budgetAlerts,
      goalReminders,
      weeklyReports,
      monthlyReports
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update notification preferences
    user.preferences.notifications = {
      email: emailNotifications,
      push: pushNotifications,
      sms: false, // Keep existing sms setting
      budgetAlerts: budgetAlerts,
      goalReminders: goalReminders,
      weeklyReports: weeklyReports,
      monthlyReports: monthlyReports
    };

    await user.save();

    res.json({ 
      message: 'Notification settings updated successfully',
      settings: user.preferences.notifications
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notification settings
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.preferences.notifications);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update privacy settings
router.put('/privacy', authMiddleware, async (req, res) => {
  try {
    const {
      dataSharing,
      analyticsTracking,
      marketingEmails
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update privacy preferences
    user.preferences.privacy = {
      dataSharing: dataSharing,
      analyticsTracking: analyticsTracking,
      marketingEmails: marketingEmails
    };

    await user.save();

    res.json({ 
      message: 'Privacy settings updated successfully',
      settings: user.preferences.privacy
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get privacy settings
router.get('/privacy', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.preferences.privacy);
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST  for push notification
router.post('/save-subscription', authMiddleware, async (req, res) => {
  try {
    const { subscription } = req.body;
    

    if (!subscription) {
      return res.status(400).json({ message: 'Subscription missing' });
    }   

    const user = await User.findById(req.user._id);
    
    
    user.pushSubscription = subscription.subscription;
     await user.save();
     
   

    res.json({ message: 'Subscription saved' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving subscription' });
  }
});


// Send test notification
router.post('/test-notification', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notifications = user.preferences.notifications;

    if (type === 'email') {
      if (!notifications.email) return res.status(400).json({ message: 'Email notifications are disabled' });

      await sendEmail(user.email, 'Test Notification', 'This is a test email from your finance app.');
    }

    if (type === 'push') {
      if (!notifications.push) return res.status(400).json({ message: 'Push notifications are disabled' });

      if (!user.pushSubscription) {
        return res.status(400).json({ message: 'No push subscription found for user' });
      }
      console.log(user.pushSubscription);
      

      await sendPushNotification(user.pushSubscription, {
        title: 'Test Notification',
        body: 'This is a push notification from your finance app!'
      });
    }

    res.json({ 
      message: `Test ${type} notification sent successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
