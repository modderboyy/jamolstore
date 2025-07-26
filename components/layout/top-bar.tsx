"use client"

import type React from "react"

import { useState } from "react"
import { Search, Menu, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InstantSearch } from "@/components/ui/instant-search"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/CartContext"

interface TopBarProps {
  searchQuery?: string
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function TopBar({ searchQuery, onSearchChange }: TopBarProps) {
  const router = useRouter()
  const { items } = useCart()
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                /* Handle menu */
              }}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <button onClick={() => router.push("/")} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">JS</span>
              </div>
              <span className="font-bold text-lg hidden sm:block">JamolStroy</span>
            </button>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-2xl mx-8">
            <InstantSearch placeholder="Mahsulot yoki ishchi qidiring..." />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/cart")}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Button>

            {/* Profile */}
            <Button variant="ghost" size="icon" onClick={() => router.push("/profile")}>
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {showMobileSearch && (
          <div className="md:hidden pb-4">
            <InstantSearch placeholder="Mahsulot yoki ishchi qidiring..." onClose={() => setShowMobileSearch(false)} />
          </div>
        )}
      </div>
    </div>
  )
}
