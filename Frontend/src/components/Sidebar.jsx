"use client"

import { Home, CreditCard, TrendingUp, Target, Settings, DollarSign, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    title: "Home",
    url: "home",
    icon: Home,
  },
  {
    title: "Transactions",
    url: "transactions",
    icon: CreditCard,
  },
  {
    title: "Insights",
    url: "insights",
    icon: TrendingUp,
  },
  {
    title: "Goals",
    url: "goals",
    icon: Target,
  },
  {
    title: "Settings",
    url: "settings",
    icon: Settings,
  },
]

export default function Sidebar({ currentPage, onPageChange, isOpen, onToggle }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">FinanceAI</span>
            <span className="text-xs text-gray-500">Personal Finance</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => onPageChange(item.url)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                currentPage === item.url
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">FinanceAI</span>
              <span className="text-xs text-gray-500">Personal Finance</span>
            </div>
          </div>
          <button onClick={onToggle} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => {
                onPageChange(item.url)
                onToggle()
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                currentPage === item.url
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>
    </>
  )
}
