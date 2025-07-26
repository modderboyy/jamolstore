"use client"

import type React from "react"
import { User, ShoppingCart, Bell } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { InstantSearch } from "@/components/ui/instant-search"
import Link from "next/link"

interface TopBarProps {
  searchQuery?: string
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function TopBar({ searchQuery = "", onSearchChange }: TopBarProps) {
  const { user } = useAuth()
  const { getTotalItems } = useCart()
  const { isTelegramWebApp } = useTelegram()
  const totalItems = getTotalItems()

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">JS</span>
            </div>
            <span className="font-bold text-lg hidden sm:block">JamolStroy</span>
          </Link>

          {/* Search Bar with Instant Search */}
          <div className="flex-1 mx-4">
            <InstantSearch
              searchQuery={searchQuery}
              onSearchChange={onSearchChange || (() => {})}
              placeholder="Mahsulot, ishchi yoki xizmat qidirish..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            {user && (
              <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            )}

            {/* Cart */}
            <Link href="/cart" className="p-2 hover:bg-muted rounded-lg transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            {/* Profile */}
            {user ? (
              <Link
                href="/profile"
                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-medium text-sm">
                    {user.first_name?.[0] || "U"}
                    {user.last_name?.[0] || ""}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium">{user.first_name}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:block text-sm">Kirish</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
