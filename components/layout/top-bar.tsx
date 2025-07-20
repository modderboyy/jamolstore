"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ShoppingCart, MapPin, Phone, Clock } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { CartSidebar } from "./cart-sidebar"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

interface CompanyInfo {
  id: string
  name: string
  version: string
  logo_url: string
  phone_number: string
  location: string
  time: string
  social_telegram: string
  social_x: string
  social_youtube: string
  social_instagram: string
}

export function TopBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { totalItems } = useCart()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [showCartSidebar, setShowCartSidebar] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("company")
        .select("*")
        .eq("version", "1.0.0")
        .eq("is_active", true)
        .single()

      if (error) throw error
      setCompanyInfo(data)
    } catch (error) {
      console.error("Company ma'lumotlarini yuklashda xatolik:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push("/")
    }
  }

  const handleCartClick = () => {
    setShowCartSidebar(true)
  }

  return (
    <>
      <div className="bg-background border-b border-border sticky top-0 z-30">
        {/* Company Info Bar - Desktop Only */}
        {companyInfo && (
          <div className="hidden md:block bg-muted/30 border-b border-border">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{companyInfo.phone_number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{companyInfo.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{companyInfo.time}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span>Ijtimoiy tarmoqlar:</span>
                  <div className="flex items-center space-x-2">
                    {companyInfo.social_telegram && (
                      <a
                        href={`https://t.me/${companyInfo.social_telegram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        Telegram
                      </a>
                    )}
                    {companyInfo.social_instagram && (
                      <a
                        href={`https://instagram.com/${companyInfo.social_instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Header */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              {companyInfo?.logo_url && (
                <Image
                  src={companyInfo.logo_url || "/placeholder.svg"}
                  alt={companyInfo.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg"
                />
              )}
              <div className="text-left">
                <h1 className="text-xl font-bold text-foreground">{companyInfo?.name || "JamolStroy"}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Qurilish materiallari</p>
              </div>
            </button>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Mahsulotlarni qidiring..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </form>
            </div>

            {/* Cart Button */}
            <button
              onClick={handleCartClick}
              className="relative p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-clean ios-button"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar - Mobile */}
          <div className="md:hidden mt-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Mahsulotlarni qidiring..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:block border-t border-border">
          <div className="container mx-auto px-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary border-b-2 border-transparent hover:border-primary transition-all"
              >
                Bosh sahifa
              </button>
              <button
                onClick={() => router.push("/catalog")}
                className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary border-b-2 border-transparent hover:border-primary transition-all"
              >
                Katalog
              </button>
              <button
                onClick={() => router.push("/workers")}
                className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary border-b-2 border-transparent hover:border-primary transition-all"
              >
                Ishchilar
              </button>
              <button
                onClick={() => router.push("/orders")}
                className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary border-b-2 border-transparent hover:border-primary transition-all"
              >
                Buyurtmalar
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary border-b-2 border-transparent hover:border-primary transition-all"
              >
                Profil
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={showCartSidebar} onClose={() => setShowCartSidebar(false)} />
    </>
  )
}
