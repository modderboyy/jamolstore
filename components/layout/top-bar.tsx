"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { useRouter } from "next/navigation"
import { Search, User, LogOut } from "lucide-react"
import { useState } from "react"

export function TopBar() {
  const { user, logout } = useAuth()
  const { isTelegramWebApp } = useTelegram()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="bg-background border-b border-border sticky top-0 z-40 safe-area-top">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <button onClick={() => router.push("/")} className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">J</span>
            </div>
            <span className="font-bold text-foreground hidden sm:block">JamolStroy</span>
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mahsulot qidirish..."
                className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all text-sm"
              />
            </div>
          </form>

          {/* User Actions - faqat Telegram Web App da emas */}
          {!isTelegramWebApp && (
            <div className="flex items-center space-x-2">
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-medium">{user.first_name.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground hidden sm:block">{user.first_name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Chiqish"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors ios-button"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Kirish</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
