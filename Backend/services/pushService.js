const webpush = require('web-push');

// Configure VAPID keys (you should set these in your environment variables)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY ,
  privateKey: process.env.VAPID_PRIVATE_KEY 
};

webpush.setVapidDetails(
  'mailto:sahilmeshram222@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

async function sendPushNotification(subscription, payload) {
  try { 
    if (!subscription || !subscription.endpoint) {
      console.log('No valid push subscription found');
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      data: payload.data || {},
      actions: [
        {
          action: 'view',
          title: 'View Details'
        }
      ]
    });

    const result = await webpush.sendNotification(subscription, notificationPayload);
    console.log('Push notification sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // If subscription is invalid, we should handle it
    if (error.statusCode === 410) {
      console.log('Push subscription expired or invalid');
      // You might want to remove this subscription from the database
    }
    
    throw error;
  }
}

module.exports = sendPushNotification;