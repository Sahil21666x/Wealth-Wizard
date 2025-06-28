"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Building2, Shield, CheckCircle } from "lucide-react"

const popularBanks = [
  { name: "Chase Bank", logo: "🏦", type: "Major Bank" },
  { name: "Bank of America", logo: "🏛️", type: "Major Bank" },
  { name: "Wells Fargo", logo: "🏪", type: "Major Bank" },
  { name: "Citi Bank", logo: "🏢", type: "Major Bank" },
  { name: "Capital One", logo: "💳", type: "Credit Union" },
  { name: "Ally Bank", logo: "💰", type: "Online Bank" },
]

export default function LinkBankModal({ open, onOpenChange }) {
  const [step, setStep] = useState(1)
  const [selectedBank, setSelectedBank] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  const filteredBanks = popularBanks.filter((bank) => bank.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleBankSelect = (bank) => {
    setSelectedBank(bank)
    setStep(2)
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    // Simulate API connection
    setTimeout(() => {
      setIsConnecting(false)
      setStep(3)
    }, 2000)
  }

  const handleClose = () => {
    setStep(1)
    setSelectedBank(null)
    setSearchTerm("")
    setIsConnecting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Link Bank Account
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Select your bank to securely connect your account"}
            {step === 2 && "Enter your banking credentials to connect"}
            {step === 3 && "Successfully connected your bank account"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
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
              {filteredBanks.map((bank, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleBankSelect(bank)}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{bank.logo}</span>
                      <div>
                        <p className="font-medium">{bank.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {bank.type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Your data is encrypted and secure. We use bank-level security.</span>
            </div>
          </div>
        )}

        {step === 2 && selectedBank && (
          <div className="space-y-4">
            <Card className="bg-gray-50">
              <CardContent className="flex items-center gap-3 p-3">
                <span className="text-2xl">{selectedBank.logo}</span>
                <div>
                  <p className="font-medium">{selectedBank.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {selectedBank.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Enter your online banking username" type="text" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" placeholder="Enter your online banking password" type="password" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
              <Shield className="h-4 w-4 text-green-600" />
              <span>We never store your banking credentials. Connection is read-only.</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConnect} disabled={isConnecting} className="flex-1">
                {isConnecting ? "Connecting..." : "Connect Account"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Account Connected!</h3>
              <p className="text-gray-600">Your {selectedBank?.name} account has been successfully linked.</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
