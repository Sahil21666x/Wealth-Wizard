
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { insightsAPI } from '../lib/api';
import { useState } from 'react';
import { useEffect } from 'react';

export default function IncomeExpenseChart() {
const [data, setData] = useState([])
 
 useEffect(()=>{

     async function fetchData()  {
     const response = await insightsAPI.getIcomeExpenseTrends()
     console.log(response.data,"insData");
     setData(response.data)
    }

    fetchData()
    
 },[])

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            className="text-xs"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            className="text-xs"
            tickFormatter={(value) => `₹${value}`}
          />
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <Tooltip 
            formatter={(value, name) => [`₹${value}`, name === 'income' ? 'Income' : 'Expenses']}
            labelFormatter={(label) => `Month: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorIncome)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorExpenses)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
