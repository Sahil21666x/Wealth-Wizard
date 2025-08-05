import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Shield, CreditCard, CheckCircle, AlertCircle, Search, Building2 } from 'lucide-react';
import { indianBanksAPI, plaidAPI } from '../lib/api';
import { v4 as uuidv4 } from 'uuid';



export default function LinkBankModal({ isOpen, onClose, step, setStep , connectedAccounts }) {
//   useEffect(() => {
//   console.log("MODAL MOUNTED");
//   return () => {
//     console.log("MODAL UNMOUNTED");
//   };
// }, []);

  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    accountNumber: ''
  });


  useEffect(() => {
    if (isOpen && step === 1) {
      fetchBanks();
    }
  }, [isOpen, step]);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await indianBanksAPI.getBanks();
      console.log(response);
      
      setBanks(response.data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
      // Fallback to static banks if API fails
      setBanks([
        { id: 'sbi', name: 'State Bank of India', code: 'SBIN' },
        { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
        { id: 'icici', name: 'ICICI Bank', code: 'ICIC' },
        { id: 'axis', name: 'Axis Bank', code: 'UTIB' },
        { id: 'pnb', name: 'Punjab National Bank', code: 'PUNB' },
        { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KKBK' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (bankId) => {
    try {
      setLoading(true);
      const response = await indianBanksAPI.getBranches(bankId);
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      // Fallback branches
      setBranches([
        { id: 'main', name: 'Main Branch', ifsc: `${selectedBank?.code}0000001` },
        { id: 'central', name: 'Central Branch', ifsc: `${selectedBank?.code}0000002` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelect = async (bank) => {
    setSelectedBank(bank);
    setStep(2);
    await fetchBranches(bank.id);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setStep(3);
  };

  const handleConnect = async () => {
    try {
      
      setLoading(true);
   
      const accountId = uuidv4(); 
      // Create link token
      const linkTokenResponse = await plaidAPI.createLinkToken();

      console.log("link res :",linkTokenResponse);
      

      // Exchange for access token with bank and branch info
      const exchangeResponse = await plaidAPI.exchangePublicToken({
        public_token: linkTokenResponse.data.link_token,
        bank_id: selectedBank.id,
        branch_id: selectedBranch.id,
        user_credentials: credentials
      });
      console.log("exch res :",exchangeResponse);    // bankName, accountNumber, accountType, ifscCode, accountHolderName
        
      // console.log(selectedBank,selectedBranch,"details");
      console.log(connectedAccounts,"con ac");
      
      
        await indianBanksAPI.addAccount({
          bankName: selectedBank.name,
          branchName: selectedBranch.name,
          accountNumber: credentials.accountNumber.slice(-4),
          ifsc: selectedBranch.ifsc,
          isPrimary : connectedAccounts.length===0 ,
          accountId : accountId
        })
      

      setStep(4);
    
    } catch (error) {
      console.error('Error linking account:', error);
      alert('Failed to link account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log("handleClose called - resetting modal");
    setStep(1);
    setSelectedBank(null);
    setSelectedBranch(null);
    setBranches([]);
    setSearchTerm('');
    setCredentials({ username: '', password: '', accountNumber: '' });
    onClose();
  };

  const filteredBanks = searchTerm 
    ? (Array.isArray(banks) ? banks : []).filter(bank => 
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : (Array.isArray(banks) ? banks : []);

  const renderStep = () => {

    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Building2 className="w-12 h-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-semibold">Select Your Bank</h3>
              <p className="text-gray-600 text-sm">
                Choose your bank from our supported Indian banks
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for your bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">Loading banks...</div>
              ) : (
                filteredBanks.map((bank) => (
                  <Card
                    key={bank.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleBankSelect(bank)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{bank.name}</p>
                          <p className="text-sm text-gray-500">{bank.code}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Your data is encrypted and secure. We use bank-level security.</span>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Select Branch</h3>
              <p className="text-gray-600 text-sm">
                Choose your branch for {selectedBank?.name}
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">Loading branches...</div>
              ) : (
                branches.map((branch) => (
                  <Card
                    key={branch.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleBranchSelect(branch)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{branch.name}</p>
                          <p className="text-sm text-gray-500">IFSC: {branch.ifsc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Button variant="outline" onClick={() => setStep(1)} className="w-full">
              Back to Banks
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <CreditCard className="w-12 h-12 text-purple-600 mx-auto" />
              <h3 className="text-lg font-semibold">Enter Account Details</h3>
              <p className="text-gray-600 text-sm">
                {selectedBank?.name} - {selectedBranch?.name}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="username">Online Banking Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <Label htmlFor="password">Online Banking Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  value={credentials.accountNumber}
                  onChange={(e) => setCredentials(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Enter your account number"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
              <Shield className="h-4 w-4 text-green-600" />
              <span>We never store your banking credentials. Connection is read-only.</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleConnect} 
                disabled={loading || !credentials.username || !credentials.password || !credentials.accountNumber} 
                className="flex-1"
              >
                {loading ? 'Connecting...' : 'Link Account'}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Account Connected!</h3>
                <p className="text-gray-600">
                  Your {selectedBank?.name} account has been successfully linked.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">What happens next?</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Your transactions will be automatically synced</li>
                    <li>• AI insights will be generated based on your spending</li>
                    <li>• You'll receive personalized recommendations</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Continue to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log("Dialog open state changed to:", open);
     if (!open) handleClose(); // Only reset when actually closing
   }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Link Bank Account</DialogTitle>
          <DialogDescription>Connect your bank account securely</DialogDescription>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}