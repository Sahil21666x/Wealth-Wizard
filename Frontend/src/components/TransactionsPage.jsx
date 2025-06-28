"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Filter, Plus, Edit, Calendar } from "lucide-react"

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Income",
  "Other",
]

const mockTransactions = [
  {
    id: 1,
    date: "2024-01-15",
    description: "Starbucks Coffee",
    amount: -5.75,
    category: "Food & Dining",
    account: "Chase Checking",
    notes: "Morning coffee before work",
  },
  {
    id: 2,
    date: "2024-01-15",
    description: "Salary Deposit",
    amount: 3200.0,
    category: "Income",
    account: "Chase Checking",
    notes: "Bi-weekly salary",
  },
  {
    id: 3,
    date: "2024-01-14",
    description: "Uber Ride",
    amount: -12.5,
    category: "Transportation",
    account: "Chase Checking",
    notes: "Ride to downtown meeting",
  },
  {
    id: 4,
    date: "2024-01-14",
    description: "Amazon Purchase",
    amount: -89.99,
    category: "Shopping",
    account: "Chase Credit Card",
    notes: "Office supplies and books",
  },
  {
    id: 5,
    date: "2024-01-13",
    description: "Netflix Subscription",
    amount: -15.99,
    category: "Entertainment",
    account: "Chase Credit Card",
    notes: "Monthly streaming subscription",
  },
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(mockTransactions)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.notes.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || transaction.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleEditTransaction = (transaction) => {
    setEditingTransaction({ ...transaction })
  }

  const handleSaveTransaction = (updatedTransaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)))
    setEditingTransaction(null)
  }

  const handleAddTransaction = (newTransaction) => {
    const transaction = {
      ...newTransaction,
      id: Math.max(...transactions.map((t) => t.id)) + 1,
      date: new Date().toISOString().split("T")[0],
    }
    setTransactions((prev) => [transaction, ...prev])
    setIsAddingTransaction(false)
  }

  const getCategoryColor = (category) => {
    const colors = {
      "Food & Dining": "bg-orange-100 text-orange-800",
      Transportation: "bg-blue-100 text-blue-800",
      Shopping: "bg-purple-100 text-purple-800",
      Entertainment: "bg-pink-100 text-pink-800",
      "Bills & Utilities": "bg-red-100 text-red-800",
      Healthcare: "bg-green-100 text-green-800",
      Travel: "bg-indigo-100 text-indigo-800",
      Income: "bg-emerald-100 text-emerald-800",
      Other: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors["Other"]
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-gray-600">Manage and categorize your transactions</p>
        </div>
        <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <TransactionDialog
            transaction={null}
            onSave={handleAddTransaction}
            onCancel={() => setIsAddingTransaction(false)}
          />
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{transaction.description}</h4>
                    <Badge className={getCategoryColor(transaction.category)}>{transaction.category}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                    <span>{transaction.account}</span>
                  </div>
                  {transaction.notes && <p className="text-sm text-gray-500">{transaction.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleEditTransaction(transaction)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
          <TransactionDialog
            transaction={editingTransaction}
            onSave={handleSaveTransaction}
            onCancel={() => setEditingTransaction(null)}
          />
        </Dialog>
      )}
    </div>
  )
}

function TransactionDialog({ transaction, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    transaction || {
      description: "",
      amount: "",
      category: "",
      account: "Chase Checking",
      notes: "",
    },
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      amount: Number.parseFloat(formData.amount),
    })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{transaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        <DialogDescription>
          {transaction ? "Update transaction details" : "Add a new transaction to your records"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Transaction description"
            required
          />
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes (optional)"
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {transaction ? "Update" : "Add"} Transaction
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
