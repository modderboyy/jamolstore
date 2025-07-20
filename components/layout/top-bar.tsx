"use client"

import type React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { useRouter, usePathname } from "next/navigation"
import { Search, User, Phone, MapPin, Clock } from "lucide-react"
import { useState } from "react"

export function TopBar() {
  const { user } = useAuth()
  const { isTelegramWebApp } = useTelegram()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      if (pathname.includes("/workers")) {
        router.push(`/workers?search=${encodeURIComponent(searchQuery.trim())}`)
      } else {
        router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  const getSearchPlaceholder = () => {
    if (pathname.includes("/workers")) {
      return "Kasb yoki ishchi qidirish..."
    }
    return "Mahsulot qidirish..."
  }

  return (
    <>
      <div className="bg-background border-b border-border sticky top-0 z-40 safe-area-top">
        {/* Company Info Bar - Only on Desktop */}
        <div className="hidden md:block bg-muted/30 border-b border-border/50">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+998 90 123 45 67</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Toshkent sh., Chilonzor t.</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Dush-Shan: 9:00-18:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Top Bar */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-4 max-w-4xl mx-auto">
            {/* Logo */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-sm">J</span>
              </div>
              <span className="font-bold text-foreground hidden sm:block">JamolStroy</span>
            </button>

            {/* Search - Centered and Responsive */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getSearchPlaceholder()}
                  className="w-full pl-10 pr-4 py-3 bg-muted/50 rounded-xl border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all text-sm placeholder:text-muted-foreground/70 shadow-sm"
                />
              </div>
            </form>

            {/* User Actions - Only show if not Telegram Web App */}
            {!isTelegramWebApp && (
              <div className="flex items-center space-x-2 flex-shrink-0">
                {user ? (
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-xl shadow-sm hover:bg-muted/70 transition-colors"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-medium">{user.first_name.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground hidden sm:block">{user.first_name}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/login")}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:shadow-md transition-all shadow-sm"
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

      {/* Desktop Navigation */}
      <div className="hidden md:block bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-8 py-3">
            <button
              onClick={() => router.push("/")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Bosh sahifa
            </button>
            <button
              onClick={() => router.push("/catalog")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Katalog
            </button>
            <button
              onClick={() => router.push("/workers")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Ishchilar
            </button>
            {user && (
              <>
                <button
                  onClick={() => router.push("/orders")}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Buyurtmalar
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Profil
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </>
  )
}
