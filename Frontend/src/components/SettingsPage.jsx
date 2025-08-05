
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Settings, User, Bell, Shield, CreditCard, Trash2, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { authAPI, indianBanksAPI, settingsAPI, subscribeUser } from '../lib/api';
import axios from 'axios';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    budgetAlerts: true,
    goalReminders: true,
    weeklyReports: false,
    monthlyReports: true,
  });

  const [privacy, setPrivacy] = useState({
    dataSharing: false,
    analyticsTracking: true,
    marketingEmails: false,
  });

  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchUserData();
    fetchConnectedAccounts();
  }, []);


  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const response = await authAPI.getProfile();
      const userData = response.data;
      
      subscribeUser(response.data._id);
      
      setProfile({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email || '',
        phone: userData.phone || '',
        currency: userData.currency || 'INR',
        timezone: userData.timezone || 'Asia/Kolkata',
      });

      // Fetch notification settings from backend
      try {
        const notificationsResponse = await settingsAPI.getNotifications();
        const notificationData = notificationsResponse.data;
        
        setNotifications({
          emailNotifications: notificationData.email,
          pushNotifications: notificationData.push,
          budgetAlerts: notificationData.budgetAlerts,
          goalReminders: notificationData.goalReminders,
          weeklyReports: notificationData.weeklyReports,
          monthlyReports: notificationData.monthlyReports,
        });
      } catch (error) {
        console.error('Error fetching notification settings:', error);
      }

      // Fetch privacy settings from backend
      try {
        const privacyResponse = await settingsAPI.getPrivacy();
        const privacyData = privacyResponse.data;
        
        setPrivacy({
          dataSharing: privacyData.dataSharing,
          analyticsTracking: privacyData.analyticsTracking,
          marketingEmails: privacyData.marketingEmails,
        });
      } catch (error) {
        console.error('Error fetching privacy settings:', error);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedAccounts = async () => {
    try {
      const response = await indianBanksAPI.getAccounts();
      const accounts = response.data.accounts || [];
      
      const formattedAccounts = accounts.map(account => ({
        id: account._id,
        name: account.bankName,
        type: account.type || 'Savings',
        accountNumber: account.accountNumber,
        lastSync: new Date(account.updatedAt || Date.now()).toLocaleString(),
        status: 'connected',
        balance: account.balances?.current || account.balance || 0
      }));
      
      setConnectedAccounts(formattedAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setConnectedAccounts([]);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const updateData = {
        firstName : profile.firstName,
        lastName : profile.lastName,
        email: profile.email,
        phone: profile.phone,
        currency: profile.currency,
        timezone: profile.timezone,
      };

      await authAPI.updateProfile(updateData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long!');
      return;
    }

    try {
      setSaving(true);
      
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = async (key, value) => {
    const updatedNotifications = { ...notifications, [key]: value };
    setNotifications(updatedNotifications);
    
    try {
      await settingsAPI.updateNotifications(updatedNotifications);
      console.log('Notification settings updated successfully');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert the change if API call fails
      setNotifications(notifications);
      alert('Failed to update notification settings. Please try again.');
    }
  };

  const handlePrivacyChange = async (key, value) => {
    const updatedPrivacy = { ...privacy, [key]: value };
    setPrivacy(updatedPrivacy);
    
    try {
      await settingsAPI.updatePrivacy(updatedPrivacy);
      console.log('Privacy settings updated successfully');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      // Revert the change if API call fails
      setPrivacy(privacy);
      alert('Failed to update privacy settings. Please try again.');
    }
  };

  const handleExportData = async () => {
    try {
      // Get user data
      const profileResponse = await authAPI.getProfile();
      const accountsResponse = await indianBanksAPI.getAccounts();
      
      const exportData = {
        profile: profileResponse.data,
        accounts: accountsResponse.data || [],
        notifications,
        privacy,
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financeai-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleTestNotification = async (type) => {
    try {
      setSaving(true);
      await settingsAPI.testNotification(type);
      alert(`Test ${type} notification sent successfully! Check your ${type === 'email' ? 'email inbox' : 'browser notifications'}.`);
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert(error.response?.data?.message || `Failed to send test ${type} notification.`);
    } finally {
      setSaving(false);
    }
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (importedData.notifications) {
          setNotifications(importedData.notifications);
          handleNotificationChange('emailNotifications', importedData.notifications.emailNotifications);
        }
        
        if (importedData.privacy) {
          setPrivacy(importedData.privacy);
          handlePrivacyChange('dataSharing', importedData.privacy.dataSharing);
        }
        
        alert('Settings imported successfully! Profile data must be updated manually for security.');
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Invalid file format. Please select a valid export file.');
      }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handleDeleteAccount = async () => {
    try {
      const confirmed = confirm('This action cannot be undone. All your data will be permanently deleted. Type "DELETE" to confirm:');
      if (confirmed !== 'DELETE') return;
      
      await authAPI.deleteAccount();
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={profile.currency}
                      onValueChange={(value) => setProfile({ ...profile, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profile.timezone}
                      onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">IST - India Standard Time</SelectItem>
                        <SelectItem value="America/New_York">EST - Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">CST - Central Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">PST - Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">GMT - Greenwich Mean Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive push notifications</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => handleNotificationChange("pushNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="budgetAlerts">Budget Alerts</Label>
                  <p className="text-sm text-gray-500">Get notified when approaching budget limits</p>
                </div>
                <Switch
                  id="budgetAlerts"
                  checked={notifications.budgetAlerts}
                  onCheckedChange={(checked) => handleNotificationChange("budgetAlerts", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="goalReminders">Goal Reminders</Label>
                  <p className="text-sm text-gray-500">Reminders about your savings goals</p>
                </div>
                <Switch
                  id="goalReminders"
                  checked={notifications.goalReminders}
                  onCheckedChange={(checked) => handleNotificationChange("goalReminders", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyReports">Weekly Reports</Label>
                  <p className="text-sm text-gray-500">Weekly spending summary</p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => handleNotificationChange("weeklyReports", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="monthlyReports">Monthly Reports</Label>
                  <p className="text-sm text-gray-500">Monthly financial insights</p>
                </div>
                <Switch
                  id="monthlyReports"
                  checked={notifications.monthlyReports}
                  onCheckedChange={(checked) => handleNotificationChange("monthlyReports", checked)}
                />
              </div>
              
              <Separator />
              
              <div className="pt-4">
                <Label className="text-base font-medium">Test Notifications</Label>
                <p className="text-sm text-gray-500 mb-3">Send test notifications to verify your settings</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTestNotification('email')}
                    disabled={!notifications.emailNotifications || saving}
                  >
                    Test Email
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTestNotification('push')}
                    disabled={!notifications.pushNotifications || saving}
                  >
                    Test Push
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Control your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dataSharing">Data Sharing</Label>
                  <p className="text-sm text-gray-500">Share anonymized data for product improvement</p>
                </div>
                <Switch
                  id="dataSharing"
                  checked={privacy.dataSharing}
                  onCheckedChange={(checked) => handlePrivacyChange("dataSharing", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analyticsTracking">Analytics Tracking</Label>
                  <p className="text-sm text-gray-500">Help us improve the app with usage analytics</p>
                </div>
                <Switch
                  id="analyticsTracking"
                  checked={privacy.analyticsTracking}
                  onCheckedChange={(checked) => handlePrivacyChange("analyticsTracking", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketingEmails">Marketing Emails</Label>
                  <p className="text-sm text-gray-500">Receive promotional emails and updates</p>
                </div>
                <Switch
                  id="marketingEmails"
                  checked={privacy.marketingEmails}
                  onCheckedChange={(checked) => handlePrivacyChange("marketingEmails", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
              <CardDescription>Manage your linked bank accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectedAccounts.length > 0 ? (
                connectedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-gray-500">{account.type} - •••• {account.accountNumber.slice(-4)}</p>
                      <p className="text-xs text-gray-500">Last sync: {account.lastSync}</p>
                      <p className="text-sm font-medium text-green-600">{formatCurrency(account.balance)}</p>
                    </div>
                    <Badge variant={account.status === "connected" ? "default" : "destructive"}>
                      {account.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No accounts connected yet
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard'}>
                + Add Account
              </Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export or delete your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={handleExportData} className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>

              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  style={{ display: 'none' }}
                  id="import-file"
                />
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => document.getElementById('import-file').click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data
                      from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>Delete Account</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
