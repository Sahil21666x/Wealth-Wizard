
const indianBanks = [ //Mock Data
  {
    id: 'sbi',
    name: 'State Bank of India',
    code: 'SBIN',
    type: 'Public Sector',
    logo: '🏛️',
    branches: [
      { id: 'sbi_mumbai_01', name: 'Mumbai Central', address: 'Mumbai Central, Mumbai', ifsc: 'SBIN0000001' },
      { id: 'sbi_delhi_01', name: 'Connaught Place', address: 'Connaught Place, New Delhi', ifsc: 'SBIN0000002' },
      { id: 'sbi_bangalore_01', name: 'MG Road', address: 'MG Road, Bangalore', ifsc: 'SBIN0000003' },
      { id: 'sbi_chennai_01', name: 'Anna Nagar', address: 'Anna Nagar, Chennai', ifsc: 'SBIN0000004' },
      { id: 'sbi_kolkata_01', name: 'Park Street', address: 'Park Street, Kolkata', ifsc: 'SBIN0000005' }
    ]
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    code: 'HDFC',
    type: 'Private Sector',
    logo: '🏦',
    branches: [
      { id: 'hdfc_mumbai_01', name: 'Bandra West', address: 'Bandra West, Mumbai', ifsc: 'HDFC0000001' },
      { id: 'hdfc_delhi_01', name: 'Rajouri Garden', address: 'Rajouri Garden, New Delhi', ifsc: 'HDFC0000002' },
      { id: 'hdfc_bangalore_01', name: 'Koramangala', address: 'Koramangala, Bangalore', ifsc: 'HDFC0000003' },
      { id: 'hdfc_chennai_01', name: 'T Nagar', address: 'T Nagar, Chennai', ifsc: 'HDFC0000004' },
      { id: 'hdfc_pune_01', name: 'Pune Camp', address: 'Camp Area, Pune', ifsc: 'HDFC0000005' }
    ]
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    code: 'ICIC',
    type: 'Private Sector',
    logo: '🏢',
    branches: [
      { id: 'icici_mumbai_01', name: 'Andheri East', address: 'Andheri East, Mumbai', ifsc: 'ICIC0000001' },
      { id: 'icici_delhi_01', name: 'Lajpat Nagar', address: 'Lajpat Nagar, New Delhi', ifsc: 'ICIC0000002' },
      { id: 'icici_bangalore_01', name: 'Electronic City', address: 'Electronic City, Bangalore', ifsc: 'ICIC0000003' },
      { id: 'icici_hyderabad_01', name: 'Hitech City', address: 'Hitech City, Hyderabad', ifsc: 'ICIC0000004' },
      { id: 'icici_ahmedabad_01', name: 'Satellite', address: 'Satellite, Ahmedabad', ifsc: 'ICIC0000005' }
    ]
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    code: 'UTIB',
    type: 'Private Sector',
    logo: '💼',
    branches: [
      { id: 'axis_mumbai_01', name: 'Lower Parel', address: 'Lower Parel, Mumbai', ifsc: 'UTIB0000001' },
      { id: 'axis_delhi_01', name: 'Karol Bagh', address: 'Karol Bagh, New Delhi', ifsc: 'UTIB0000002' },
      { id: 'axis_bangalore_01', name: 'Whitefield', address: 'Whitefield, Bangalore', ifsc: 'UTIB0000003' },
      { id: 'axis_chennai_01', name: 'Adyar', address: 'Adyar, Chennai', ifsc: 'UTIB0000004' },
      { id: 'axis_kochi_01', name: 'Marine Drive', address: 'Marine Drive, Kochi', ifsc: 'UTIB0000005' }
    ]
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank',
    code: 'PUNB',
    type: 'Public Sector',
    logo: '🏪',
    branches: [
      { id: 'pnb_delhi_01', name: 'Chandni Chowk', address: 'Chandni Chowk, New Delhi', ifsc: 'PUNB0000001' },
      { id: 'pnb_chandigarh_01', name: 'Sector 17', address: 'Sector 17, Chandigarh', ifsc: 'PUNB0000002' },
      { id: 'pnb_mumbai_01', name: 'Fort', address: 'Fort, Mumbai', ifsc: 'PUNB0000003' },
      { id: 'pnb_bangalore_01', name: 'Commercial Street', address: 'Commercial Street, Bangalore', ifsc: 'PUNB0000004' },
      { id: 'pnb_lucknow_01', name: 'Hazratganj', address: 'Hazratganj, Lucknow', ifsc: 'PUNB0000005' }
    ]
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    code: 'KKBK',
    type: 'Private Sector',
    logo: '💳',
    branches: [
      { id: 'kotak_mumbai_01', name: 'Nariman Point', address: 'Nariman Point, Mumbai', ifsc: 'KKBK0000001' },
      { id: 'kotak_delhi_01', name: 'CP', address: 'Connaught Place, New Delhi', ifsc: 'KKBK0000002' },
      { id: 'kotak_bangalore_01', name: 'Brigade Road', address: 'Brigade Road, Bangalore', ifsc: 'KKBK0000003' },
      { id: 'kotak_pune_01', name: 'FC Road', address: 'FC Road, Pune', ifsc: 'KKBK0000004' },
      { id: 'kotak_chennai_01', name: 'Express Avenue', address: 'Express Avenue, Chennai', ifsc: 'KKBK0000005' }
    ]
  }
];

module.exports = indianBanks;
