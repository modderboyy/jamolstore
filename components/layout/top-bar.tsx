"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShoppingCart, User, Bell, Search } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { InstantSearch } from "@/components/ui/instant-search"

interface SearchResult {
  id: string
  title: string
  description: string
  price: number
  image_url: string
  category: string
  type: "product" | "worker"
  rating: number
  reviews_count: number
}

export function TopBar() {
  const { user } = useAuth()
  const { getTotalItems } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleResultSelect = (result: SearchResult) => {
    if (result.type === "product") {
      router.push(`/product/${result.id}`)
    } else if (result.type === "worker") {
      router.push(`/workers?id=${result.id}`)
    }
    setShowMobileSearch(false)
  }

  const handleProfileClick = () => {
    if (user) {
      router.push("/profile")
    } else {
      router.push("/login")
    }
  }

  const handleCartClick = () => {
    router.push("/cart")
  }

  const totalItems = mounted ? getTotalItems() : 0

  return (
    <>
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push("/")} className="text-xl font-bold text-primary">
                JamolStroy
              </button>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <InstantSearch onResultSelect={handleResultSelect} placeholder="Mahsulot yoki ishchi qidiring..." />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Mobile Search Button */}
              <button
                onClick={() => setShowMobileSearch(true)}
                className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              {user && (
                <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                </button>
              )}

              {/* Cart */}
              <button onClick={handleCartClick} className="p-2 rounded-lg hover:bg-muted transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>

              {/* Profile */}
              <button onClick={handleProfileClick} className="p-2 rounded-lg hover:bg-muted transition-colors">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.first_name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 bg-background z-50 md:hidden">
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                ←
              </button>
              <div className="flex-1">
                <InstantSearch
                  onResultSelect={handleResultSelect}
                  placeholder="Qidirish..."
                  onClose={() => setShowMobileSearch(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
