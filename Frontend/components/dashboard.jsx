"use client"

import { useState } from "react"
import AppSidebar from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import DashboardHome from "@/components/dashboard-home"
import TransactionsPage from "@/components/transactions-page"
import InsightsPage from "@/components/insights-page"
import GoalsPage from "@/components/goals-page"
import SettingsPage from "@/components/settings-page"
import LinkBankModal from "@/components/link-bank-modal"

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("home")
  const [showLinkBank, setShowLinkBank] = useState(false)

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
    <>
      <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="font-semibold capitalize">{currentPage === "home" ? "Dashboard" : currentPage}</h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto">{renderPage()}</div>
      </SidebarInset>
      <LinkBankModal open={showLinkBank} onOpenChange={setShowLinkBank} />
    </>
  )
}
