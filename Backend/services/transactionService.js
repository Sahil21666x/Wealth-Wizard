
const categoryMapping = {
  // Food & Dining
  'Food and Drink': ['restaurant', 'food', 'dining', 'cafe', 'bar', 'pizza', 'coffee', 'lunch', 'dinner'],
  'Groceries': ['grocery', 'supermarket', 'market', 'walmart', 'target', 'costco'],
  
  // Transportation
  'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'metro', 'bus', 'train', 'parking'],
  'Auto': ['auto', 'car', 'vehicle', 'mechanic', 'oil change', 'tire'],
  
  // Shopping
  'Shopping': ['amazon', 'store', 'retail', 'clothing', 'electronics', 'department'],
  
  // Bills & Utilities
  'Utilities': ['electric', 'gas', 'water', 'internet', 'phone', 'cable', 'utility'],
  'Rent': ['rent', 'mortgage', 'housing'],
  
  // Entertainment
  'Entertainment': ['movie', 'theater', 'netflix', 'spotify', 'game', 'entertainment'],
  
  // Healthcare
  'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medical', 'dentist', 'health'],
  
  // Financial
  'Banking': ['bank', 'atm', 'fee', 'transfer', 'payment'],
  'Investment': ['investment', 'trading', 'stock', 'mutual fund'],
  
  // Travel
  'Travel': ['hotel', 'airline', 'flight', 'vacation', 'travel', 'booking'],
  
  // Education
  'Education': ['school', 'university', 'tuition', 'education', 'course'],
  
  // Personal Care
  'Personal Care': ['salon', 'spa', 'gym', 'fitness', 'beauty', 'barber'],
  
  // Miscellaneous
  'Other': []
};

function categorizeTransaction(transaction) {
  const description = transaction.name.toLowerCase();
  const plaidCategories = transaction.category || [];
  
  // First, try to use Plaid's categorization
  if (plaidCategories.length > 0) {
    const primary = plaidCategories[0];
    const detailed = plaidCategories[plaidCategories.length - 1];
    
    // Map Plaid categories to our categories
    const mappedCategory = mapPlaidCategory(primary);
    
    return {
      primary: mappedCategory,
      detailed: detailed
    };
  }
  
  // Fallback to keyword-based categorization
  for (const [category, keywords] of Object.entries(categoryMapping)) {
    if (keywords.some(keyword => description.includes(keyword))) {
      return {
        primary: category,
        detailed: category
      };
    }
  }
  
  return {
    primary: 'Other',
    detailed: 'Miscellaneous'
  };
}

function mapPlaidCategory(plaidCategory) {
  const categoryMap = {
    'Food and Drink': 'Food and Drink',
    'Shops': 'Shopping',
    'Transportation': 'Transportation',
    'Payment': 'Banking',
    'Recreation': 'Entertainment',
    'Service': 'Personal Care',
    'Healthcare': 'Healthcare',
    'Travel': 'Travel',
    'Bank Fees': 'Banking',
    'Cash Advance': 'Banking',
    'Interest': 'Banking',
    'Rent and Utilities': 'Utilities'
  };
  
  return categoryMap[plaidCategory] || 'Other';
}

function calculateMonthlySpending(transactions) {
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const month = new Date(transaction.date).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = 0;
    }
    monthlyData[month] += transaction.amount;
  });
  
  return monthlyData;
}

function calculateCategorySpending(transactions) {
  const categoryData = {};
  
  transactions.forEach(transaction => {
    const category = transaction.category.primary;
    if (!categoryData[category]) {
      categoryData[category] = 0;
    }
    categoryData[category] += transaction.amount;
  });
  
  return categoryData;
}

module.exports = {
  categorizeTransaction,
  calculateMonthlySpending,
  calculateCategorySpending
};
