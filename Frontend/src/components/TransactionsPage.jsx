import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  Download,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { transactionsAPI } from '../lib/api';

const categories = [
  "Food & Dining", "Transportation", "Shopping", "Bills & Utilities",
  "Entertainment", "Healthcare", "Education", "Income", "Other"
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, selectedCategory, selectedType, sortConfig]);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 50,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedType !== 'all' && { type: selectedType })
      };

      const response = await transactionsAPI.getAll(params);

      setTransactions(response.data.transactions || []);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.merchant?.name && transaction.merchant.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(transaction =>
        transaction.category?.primary === selectedCategory
      );
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter(transaction => transaction.type === selectedType);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredTransactions(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction({ ...transaction });
  };

  const handleSaveTransaction = async (transactionData) => {
    try {
      if (transactionData._id) {
        // Update existing transaction
        await transactionsAPI.update(transactionData._id, transactionData);
      } else {
        // Create new transaction
        await transactionsAPI.create(transactionData);
      }
      await fetchTransactions(pagination.currentPage);
      setEditingTransaction(null);
      setIsAddingTransaction(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError('Failed to save transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await transactionsAPI.delete(transactionId);
      await fetchTransactions(pagination.currentPage);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTransactionStats = () => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, net: income - expenses };
  };

  const stats = getTransactionStats();

  if (loading && transactions.length === 0) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 mb-4"></div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 sm:h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-blue-600 " />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              View and manage your financial transactions
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <TransactionDialog
              transaction={null}
              onSave={handleSaveTransaction}
              onClose={() => setIsAddingTransaction(false)}
            />
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(stats.income)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {filteredTransactions.filter(t => t.type === 'income').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {formatCurrency(stats.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {filteredTransactions.filter(t => t.type === 'expense').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.net)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {filteredTransactions.length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <div className="flex-1 min-w-full sm:min-w-64">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
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
            <div className="w-full sm:w-auto">
              <Label htmlFor="type">Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Transaction History</CardTitle>
          <CardDescription>
            {pagination.total} total transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                {/* Mobile View */}
                <div className="sm:hidden space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <Badge variant="outline">
                          {transaction.category?.primary || 'Other'}
                        </Badge>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </div>
                      <div className="mt-3 flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this transaction? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTransaction(transaction._id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <table className="hidden sm:table w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('date')}
                          className="font-semibold"
                        >
                          Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </th>
                      <th className="text-left p-2 font-semibold">Description</th>
                      <th className="text-left p-2 font-semibold">Category</th>
                      <th className="text-left p-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('amount')}
                          className="font-semibold"
                        >
                          Amount
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </th>
                      <th className="text-left p-2 font-semibold">Type</th>
                      <th className="text-left p-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            {transaction.merchant?.name && (
                              <div className="text-sm text-muted-foreground">
                                {transaction.merchant.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {transaction.category?.primary || 'Other'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTransaction(transaction)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this transaction? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTransaction(transaction._id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  Showing {((pagination.currentPage - 1) * 50) + 1} to {Math.min(pagination.currentPage * 50, pagination.total)} of {pagination.total} transactions
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => fetchTransactions(pagination.currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Previous</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => fetchTransactions(pagination.currentPage + 1)}
                  >
                    <span className="mr-2 hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found. Add your first transaction to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <Dialog open={true} onOpenChange={() => setEditingTransaction(null)}>
          <TransactionDialog
            transaction={editingTransaction}
            onSave={handleSaveTransaction}
            onClose={() => setEditingTransaction(null)}
          />
        </Dialog>
      )}
    </div>
  );
}

function TransactionDialog({ transaction, onSave, onClose }) {
  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount || '',
    category: transaction?.category?.primary || 'Other',
    type: transaction?.type || 'expense',
    date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    merchant: transaction?.merchant?.name || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...transaction,
      ...formData,
      amount: parseFloat(formData.amount),
      category: { primary: formData.category },
      merchant: { name: formData.merchant }
    });
  };

  return (
    <DialogContent className="sm:max-w-md md:max-w-lg">
      <DialogHeader>
        <DialogTitle>{transaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
        <DialogDescription>
          {transaction ? 'Update transaction details' : 'Enter transaction information'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="merchant">Merchant (Optional)</Label>
          <Input
            id="merchant"
            value={formData.merchant}
            onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
          />
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto">
            {transaction ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}