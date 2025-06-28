"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import DashboardHome from "@/components/DashboardHome"
import TransactionsPage from "@/components/TransactionsPage"
import InsightsPage from "@/components/InsightsPage"
import GoalsPage from "@/components/GoalsPage"
import SettingsPage from "@/components/SettingsPage"
import LinkBankModal from "@/components/LinkBankModal"

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("home")
  const [showLinkBank, setShowLinkBank] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <DashboardHome onLinkBank={() => setShowLinkBank(true)} />
      case "transactions":
        return <TransactionsPage />
      case "insights":
        return <InsightsPage />
      case "goals":
        return <GoalsPage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardHome onLinkBank={() => setShowLinkBank(true)} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:justify-start">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 capitalize">
            {currentPage === "home" ? "Dashboard" : currentPage}
          </h1>
        </header>

        <main className="flex-1 overflow-auto">{renderPage()}</main>
      </div>

      <LinkBankModal open={showLinkBank} onOpenChange={setShowLinkBank} />
    </div>
  )
}
