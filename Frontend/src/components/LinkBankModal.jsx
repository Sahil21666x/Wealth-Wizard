
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

export default function LinkBankModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleLinkBank = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStep(3);
      setLoading(false);
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Connect Your Bank Account</h3>
                <p className="text-gray-600">
                  Securely link your bank account to automatically track transactions and get personalized insights.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Bank-level Security</p>
                  <p className="text-xs text-green-700">256-bit encryption and read-only access</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Automatic Categorization</p>
                  <p className="text-xs text-blue-700">AI-powered transaction categorization</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Choose Your Bank</h3>
                <p className="text-gray-600">
                  Select your financial institution from our secure list of supported banks.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One'].map((bank) => (
                <Card key={bank} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{bank}</p>
                        <p className="text-sm text-gray-500">Supported</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleLinkBank} disabled={loading} className="flex-1">
                {loading ? 'Connecting...' : 'Link Account'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Account Connected!</h3>
                <p className="text-gray-600">
                  Your bank account has been successfully linked. We're now syncing your transaction data.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">What happens next?</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Your transactions will be automatically categorized</li>
                    <li>• AI insights will be generated based on your spending patterns</li>
                    <li>• You'll receive personalized budgeting recommendations</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={onClose} className="w-full">
              Continue to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Link Bank Account</DialogTitle>
          <DialogDescription>Connect your bank account securely</DialogDescription>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
