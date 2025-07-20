"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { Search, Bell } from "lucide-react"
import Image from "next/image"

export function TopBar() {
  const { user } = useAuth()
  const { isTelegramWebApp } = useTelegram()

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Image src="/placeholder-logo.svg" alt="JamolStroy" width={32} height={32} className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold text-foreground">JamolStroy</h1>
              <p className="text-xs text-muted-foreground">Qurilish materiallari</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Notifications */}
            {user && (
              <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            )}

            {/* User Avatar */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">
                    {user.first_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user.first_name}</p>
                  <p className="text-xs text-muted-foreground">{isTelegramWebApp ? "Telegram" : "Web"}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Web</p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
