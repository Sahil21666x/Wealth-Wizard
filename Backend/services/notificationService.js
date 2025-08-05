
const sendEmail = require('./emailService');
const sendPushNotification = require('./pushService');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const aiService = require('./aiService');
const moment = require('moment');

class NotificationService {
  // Send goal progress notifications
  async sendGoalProgressNotification(userId, goalId, contributionAmount) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.preferences.notifications.goalReminders) {
        return;
      }
     
      const goal = await Goal.findById(goalId);
      
      if (!goal) return;

      const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
      const remainingAmount = goal.targetAmount - goal.currentAmount;

      const notifications = user.preferences.notifications;
      const title = `Goal Progress Update: ${goal.title}`;
      const message = `Great job! You contributed ₹${contributionAmount} to your ${goal.title} goal. You're now ${progress.toFixed(1)}% complete with ₹${remainingAmount} remaining.`;

      // Send email notification
      if (notifications.email) {
        await sendEmail(
          user.email,
          title,
          `
          <h2>${title}</h2>
          <p>${message}</p>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>Goal Details:</strong><br>
            Target Amount: ₹${goal.targetAmount}<br>
            Current Amount: ₹${goal.currentAmount}<br>
            Progress: ${progress.toFixed(1)}%<br>
            Target Date: ${new Date(goal.targetDate).toLocaleDateString()}
          </div>
          <p>Keep up the excellent work towards achieving your financial goals!</p>
          `
        );
      }

      // Send push notification
      if (notifications.push && user.pushSubscription) {
        await sendPushNotification(user.pushSubscription, {
          title,
          body: message,
          icon: '/placeholder-logo.png',
          data: { type: 'goal_progress', goalId: goal._id }
        });
      }

      // Check for milestone achievements
      await this.checkGoalMilestones(userId, goal);

    } catch (error) {
      console.error('Error sending goal progress notification:', error);
    }
  }

  // Send insights notifications
  async sendInsightsNotification(userId, insightType, data) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.preferences.notifications.weeklyReports) {
        return;
      }

      const notifications = user.preferences.notifications;
      let title, message, emailContent;

      switch (insightType) {
        case 'spending_alert':
          title = 'Spending Alert';
          message = `You've spent ₹${data.amount} more than usual on ${data.category} this month.`;
          emailContent = `
            <h2>${title}</h2>
            <p>${message}</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ef4444;">
              <strong>Spending Analysis:</strong><br>
              Category: ${data.category}<br>
              This Month: ₹${data.currentAmount}<br>
              Last Month: ₹${data.previousAmount}<br>
              Increase: ${data.percentageIncrease}%
            </div>
            <p><strong>Recommendation:</strong> ${data.suggestion}</p>
          `;
          break;

        case 'budget_exceeded':
          title = 'Budget Alert';
          message = `You've exceeded your monthly budget by ₹${data.exceededAmount}.`;
          emailContent = `
            <h2>${title}</h2>
            <p>${message}</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ef4444;">
              <strong>Budget Summary:</strong><br>
              Budget Limit: ₹${data.budgetLimit}<br>
              Current Spending: ₹${data.currentSpending}<br>
              Exceeded By: ₹${data.exceededAmount}
            </div>
            <p><strong>Suggestion:</strong> Consider reviewing your expenses and adjusting your spending habits.</p>
          `;
          break;

        case 'savings_opportunity':
          title = 'Savings Opportunity';
          message = `You could save ₹${data.potentialSavings} by optimizing your ${data.category} expenses.`;
          emailContent = `
            <h2>${title}</h2>
            <p>${message}</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #22c55e;">
              <strong>Savings Analysis:</strong><br>
              Category: ${data.category}<br>
              Current Monthly Spending: ₹${data.currentSpending}<br>
              Potential Savings: ₹${data.potentialSavings}<br>
              Optimization Rate: ${data.optimizationRate}%
            </div>
            <p><strong>Recommendation:</strong> ${data.suggestion}</p>
          `;
          break;

        default:
          return;
      }

      // Send email notification
      if (notifications.email) {
        await sendEmail(user.email, title, emailContent);
      }

      // Send push notification
      if (notifications.push && user.pushSubscription) {
        await sendPushNotification(user.pushSubscription, {
          title,
          body: message,
          icon: '/placeholder-logo.png',
          data: { type: insightType, ...data }
        });
      }

    } catch (error) {
      console.error('Error sending insights notification:', error);
    }
  }

  // Send weekly/monthly reports
  async sendPeriodicReport(userId, reportType = 'weekly') {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const notifications = user.preferences.notifications;
      const shouldSend = reportType === 'weekly' ? notifications.weeklyReports : notifications.monthlyReports;
      
      if (!shouldSend) return;

      const period = reportType === 'weekly' ? 'week' : 'month';
      const startDate = moment().subtract(1, period).startOf(period);
      const endDate = moment().subtract(1, period).endOf(period);

      // Get transactions for the period
      const transactions = await Transaction.find({
        userId,
        date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      });

      const expenses = transactions.filter(t => t.type === 'expense');
      const income = transactions.filter(t => t.type === 'income');

      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
      const netIncome = totalIncome - totalExpenses;

      // Get category breakdown
      const categoryBreakdown = expenses.reduce((acc, t) => {
        const category = t.category.primary;
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {});

      const topCategories = Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      const title = `Your ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Financial Report`;
      const message = `Last ${period}: ₹${totalIncome} income, ₹${totalExpenses} expenses, ₹${netIncome} net ${netIncome >= 0 ? 'profit' : 'loss'}.`;

      const emailContent = `
        <h2>${title}</h2>
        <p>Here's your financial summary for last ${period}:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Financial Overview</h3>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Total Income:</span>
            <span style="color: #22c55e; font-weight: bold;">₹${totalIncome}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Total Expenses:</span>
            <span style="color: #ef4444; font-weight: bold;">₹${totalExpenses}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            <span><strong>Net Income:</strong></span>
            <span style="color: ${netIncome >= 0 ? '#22c55e' : '#ef4444'}; font-weight: bold;">₹${netIncome}</span>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Top Spending Categories</h3>
          ${topCategories.map(([category, amount]) => `
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>${category}:</span>
              <span style="font-weight: bold;">₹${amount}</span>
            </div>
          `).join('')}
        </div>

        <p>Keep tracking your expenses and working towards your financial goals!</p>
      `;

      // Send email notification
      if (notifications.email) {
        await sendEmail(user.email, title, emailContent);
      }

      // Send push notification
      if (notifications.push && user.pushSubscription) {
        await sendPushNotification(user.pushSubscription, {
          title,
          body: message,
          icon: '/placeholder-logo.png',
          data: { type: 'periodic_report', reportType, period }
        });
      }

    } catch (error) {
      console.error('Error sending periodic report:', error);
    }
  }

  // Check and notify about goal milestones
  async checkGoalMilestones(userId, goal) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.preferences.notifications.goalReminders) {
        return;
      }

      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const milestones = [25, 50, 75, 90, 100];
      
      for (const milestone of milestones) {
        if (progress >= milestone && !goal.milestonesAchieved?.includes(milestone)) {
          // Mark milestone as achieved
          if (!goal.milestonesAchieved) goal.milestonesAchieved = [];
          goal.milestonesAchieved.push(milestone);
          await goal.save();

          const title = milestone === 100 ? 'Goal Completed! 🎉' : `Milestone Achieved: ${milestone}%`;
          const message = milestone === 100 
            ? `Congratulations! You've successfully completed your ${goal.title} goal!`
            : `Great progress! You've reached ${milestone}% of your ${goal.title} goal.`;

          const notifications = user.preferences.notifications;

          // Send email notification
          if (notifications.email) {
            await sendEmail(
              user.email,
              title,
              `
              <h2>${title}</h2>
              <p>${message}</p>
              <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #22c55e;">
                <strong>Goal: ${goal.title}</strong><br>
                Progress: ${progress.toFixed(1)}%<br>
                Amount Achieved: ₹${goal.currentAmount}<br>
                Target Amount: ₹${goal.targetAmount}
              </div>
              ${milestone === 100 
                ? '<p>🎉 Congratulations on achieving your financial goal! Consider setting a new goal to continue your financial journey.</p>'
                : '<p>Keep up the excellent work! You\'re making great progress towards your financial goal.</p>'
              }
              `
            );
          }

          // Send push notification
          if (notifications.push && user.pushSubscription) {
            await sendPushNotification(user.pushSubscription, {
              title,
              body: message,
              icon: '/placeholder-logo.png',
              data: { type: 'milestone', goalId: goal._id, milestone }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking goal milestones:', error);
    }
  }

  // Analyze and send smart insights
  async analyzeAndNotify(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.preferences.notifications.weeklyReports) {
        return;
      }

      // Get recent transactions
      const transactions = await Transaction.find({ 
        userId,
        date: { $gte: moment().subtract(30, 'days').toDate() }
      });

      if (transactions.length === 0) return;

      // Analyze spending patterns
      const insights = await aiService.analyzeSpendingPatterns(transactions);
      const anomalies = await aiService.detectAnomalies(transactions);

      // Check for significant spending increases
      const monthlySpending = {};
      transactions.forEach(t => {
        const month = moment(t.date).format('YYYY-MM');
        const category = t.category.primary;
        
        if (!monthlySpending[month]) monthlySpending[month] = {};
        if (!monthlySpending[month][category]) monthlySpending[month][category] = 0;
        
        monthlySpending[month][category] += t.amount;
      });

      const months = Object.keys(monthlySpending).sort();
      if (months.length >= 2) {
        const currentMonth = months[months.length - 1];
        const previousMonth = months[months.length - 2];

        Object.keys(monthlySpending[currentMonth]).forEach(async (category) => {
          const current = monthlySpending[currentMonth][category];
          const previous = monthlySpending[previousMonth]?.[category] || 0;
          
          if (previous > 0) {
            const increase = ((current - previous) / previous) * 100;
            
            if (increase > 30) { // 30% increase threshold
              await this.sendInsightsNotification(userId, 'spending_alert', {
                category,
                amount: current - previous,
                currentAmount: current,
                previousAmount: previous,
                percentageIncrease: increase.toFixed(1),
                suggestion: `Consider reviewing your ${category} expenses and setting a budget limit.`
              });
            }
          }
        });
      }

      // Check for savings opportunities
      const expenseCategories = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        const category = t.category.primary;
        expenseCategories[category] = (expenseCategories[category] || 0) + t.amount;
      });

      const topCategory = Object.entries(expenseCategories)
        .sort(([,a], [,b]) => b - a)[0];

      if (topCategory && topCategory[1] > 5000) { // If spending > 5000 in any category
        const [category, amount] = topCategory;
        const potentialSavings = amount * 0.15; // Assume 15% savings potential

        await this.sendInsightsNotification(userId, 'savings_opportunity', {
          category,
          currentSpending: amount,
          potentialSavings: potentialSavings.toFixed(0),
          optimizationRate: 15,
          suggestion: `Review your ${category} expenses and look for subscription cancellations or alternative options.`
        });
      }

    } catch (error) {
      console.error('Error analyzing and notifying:', error);
    }
  }
}

module.exports = new NotificationService();
