"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const data = [
  { month: "Jul", income: 4800, expenses: 3200 },
  { month: "Aug", income: 5100, expenses: 3400 },
  { month: "Sep", income: 4900, expenses: 3600 },
  { month: "Oct", income: 5300, expenses: 3800 },
  { month: "Nov", income: 5000, expenses: 3500 },
  { month: "Dec", income: 5200, expenses: 3850 },
]

export default function IncomeExpenseChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Legend />
        <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
