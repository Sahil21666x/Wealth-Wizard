
const tf = require('@tensorflow/tfjs');


class AIService {
  constructor() {
    this.spendingModel = null;
    this.anomalyModel = null;
  }

  // Predict next month's spending
  async predictSpending(transactions) {
    try {
      if (transactions.length < 10) {
        return { prediction: 0, confidence: 0 };
      }

      // Prepare data for prediction
      const monthlySpending = this.aggregateMonthlySpending(transactions);
      const spendingValues = Object.values(monthlySpending);

      if (spendingValues.length < 3) {
        return { prediction: spendingValues[spendingValues.length - 1] || 0, confidence: 0.5 };
      }

      // Simple moving average prediction (can be enhanced with TensorFlow.js model)
      const recentMonths = spendingValues.slice(-3);
      const prediction = recentMonths.reduce((sum, val) => sum + val, 0) / recentMonths.length;

      // Calculate trend
      const trend = this.calculateTrend(spendingValues);
      const adjustedPrediction = prediction * (1 + trend);

      // Category-wise predictions
      const categoryPredictions = this.predictCategorySpending(transactions);

      return {
        nextMonthPrediction: Math.round(adjustedPrediction),
        trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        confidence: Math.min(0.9, 0.5 + (spendingValues.length * 0.1)),
        categoryPredictions
      };
    } catch (error) {
      console.error('Error predicting spending:', error);
      return { prediction: 0, confidence: 0 };
    }
  }

  // Detect spending anomalies
  async detectAnomalies(transactions) {
    try {
      const anomalies = [];
      
      if (transactions.length < 10) {
        return anomalies;
      }

      // Calculate statistics for anomaly detection
      const amounts = transactions.map(t => t.amount);
      const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      
      // Z-score based anomaly detection
      const threshold = 2.5; // transactions more than 2.5 standard deviations from mean
      
      transactions.forEach(transaction => {
        const zScore = Math.abs((transaction.amount - mean) / stdDev);
        
        if (zScore > threshold) {
          anomalies.push({
            id: transaction._id,
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date,
            zScore: zScore,
            confidence: Math.min(zScore / threshold, 1),
            reason: transaction.amount > mean ? 'Unusually high spending' : 'Unusually low spending'
          });
        }
      });

      // Category-based anomaly detection
      const categoryAnomalies = this.detectCategoryAnomalies(transactions);
      anomalies.push(...categoryAnomalies);

      return anomalies.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }

  // Helper method to aggregate monthly spending
  aggregateMonthlySpending(transactions) {
    const monthly = {};
    
    transactions.forEach(transaction => {
      const month = new Date(transaction.date).toISOString().slice(0, 7);
      if (!monthly[month]) {
        monthly[month] = 0;
      }
      monthly[month] += transaction.amount;
    });
    
    return monthly;
  }

  // Helper method to calculate trend
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    
    if (older.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    return (recentAvg - olderAvg) / olderAvg;
  }

  // Predict category-wise spending
  predictCategorySpending(transactions) {
    const categorySpending = {};
    const currentMonth = new Date().getMonth();
    
    // Group transactions by category and month
    transactions.forEach(transaction => {
      const month = new Date(transaction.date).getMonth();
      const category = transaction.category.primary;
      
      if (!categorySpending[category]) {
        categorySpending[category] = [];
      }
      
      if (!categorySpending[category][month]) {
        categorySpending[category][month] = 0;
      }
      
      categorySpending[category][month] += transaction.amount;
    });

    // Predict next month for each category
    const predictions = {};
    
    Object.entries(categorySpending).forEach(([category, monthlyData]) => {
      const values = Object.values(monthlyData).filter(val => val > 0);
      if (values.length > 0) {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        predictions[category] = Math.round(average);
      }
    });

    return predictions;
  }

  // Detect category-based anomalies
  detectCategoryAnomalies(transactions) {
    const anomalies = [];
    const categoryData = {};
    
    // Group by category
    transactions.forEach(transaction => {
      const category = transaction.category.primary;
      if (!categoryData[category]) {
        categoryData[category] = [];
      }
      categoryData[category].push(transaction);
    });

    // Check each category for anomalies
    Object.entries(categoryData).forEach(([category, categoryTransactions]) => {
      if (categoryTransactions.length < 5) return;
      
      const amounts = categoryTransactions.map(t => t.amount);
      const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
      const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);
      
      categoryTransactions.forEach(transaction => {
        const zScore = Math.abs((transaction.amount - mean) / stdDev);
        
        if (zScore > 2) {
          anomalies.push({
            id: transaction._id,
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date,
            category: category,
            zScore: zScore,
            confidence: Math.min(zScore / 2, 1),
            reason: `Unusual ${category} spending`
          });
        }
      });
    });

    return anomalies;
  }

  // Analyze spending patterns
  analyzeSpendingPatterns(transactions) {
    const patterns = {
      weekdaySpending: this.analyzeWeekdaySpending(transactions),
      monthlyTrends: this.analyzeMonthlyTrends(transactions),
      seasonalPatterns: this.analyzeSeasonalPatterns(transactions)
    };

    return patterns;
  }

  analyzeWeekdaySpending(transactions) {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdaySpending = Array(7).fill(0);
    const weekdayCounts = Array(7).fill(0);

    transactions.forEach(transaction => {
      const dayOfWeek = new Date(transaction.date).getDay();
      weekdaySpending[dayOfWeek] += transaction.amount;
      weekdayCounts[dayOfWeek]++;
    });

    return weekdays.map((day, index) => ({
      day,
      totalSpending: weekdaySpending[index],
      averageSpending: weekdayCounts[index] > 0 ? weekdaySpending[index] / weekdayCounts[index] : 0,
      transactionCount: weekdayCounts[index]
    }));
  }

  analyzeMonthlyTrends(transactions) {
    const monthlyData = this.aggregateMonthlySpending(transactions);
    const months = Object.keys(monthlyData).sort();
    
    return months.map(month => ({
      month,
      spending: monthlyData[month]
    }));
  }

  analyzeSeasonalPatterns(transactions) {
    const seasons = { winter: 0, spring: 0, summer: 0, fall: 0 };
    const seasonCounts = { winter: 0, spring: 0, summer: 0, fall: 0 };

    transactions.forEach(transaction => {
      const month = new Date(transaction.date).getMonth();
      let season;
      
      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'fall';
      else season = 'winter';

      seasons[season] += transaction.amount;
      seasonCounts[season]++;
    });

    return Object.entries(seasons).map(([season, total]) => ({
      season,
      totalSpending: total,
      averageSpending: seasonCounts[season] > 0 ? total / seasonCounts[season] : 0,
      transactionCount: seasonCounts[season]
    }));
  }
}

module.exports = new AIService();
