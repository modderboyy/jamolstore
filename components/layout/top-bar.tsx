"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, ShoppingCart, MapPin, Phone, Clock, Home, Grid3X3, Users, Package, User } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { CartSidebar } from "./cart-sidebar"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"

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

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}

const navigationItems: NavItem[] = [
  { id: "home", label: "Bosh sahifa", icon: Home, path: "/" },
  { id: "catalog", label: "Katalog", icon: Grid3X3, path: "/catalog" },
  { id: "workers", label: "Ishchilar", icon: Users, path: "/workers" },
  { id: "orders", label: "Buyurtmalar", icon: Package, path: "/orders" },
  { id: "profile", label: "Profil", icon: User, path: "/profile" },
]

export function TopBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { totalItems } = useCart()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [showCartSidebar, setShowCartSidebar] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  useEffect(() => {
    // Auto dark/light mode based on Uzbekistan time (GMT+5)
    const setThemeBasedOnTime = () => {
      const now = new Date()
      // Convert to Uzbekistan time (UTC+5)
      const uzbekTime = new Date(now.getTime() + 5 * 60 * 60 * 1000)
      const hour = uzbekTime.getHours()

      // Light mode: 6 AM to 6 PM, Dark mode: 6 PM to 6 AM
      const isDark = hour < 6 || hour >= 18

      if (window.Telegram?.WebApp) {
        // Telegram Web App uchun theme
        const tgTheme = window.Telegram.WebApp.colorScheme
        document.documentElement.classList.toggle("dark", tgTheme === "dark" || isDark)
      } else {
        // Oddiy web uchun vaqtga qarab
        document.documentElement.classList.toggle("dark", isDark)
      }
    }

    setThemeBasedOnTime()

    // Har daqiqada yangilaymiz
    const interval = setInterval(setThemeBasedOnTime, 60000)

    return () => clearInterval(interval)
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
          <div className="hidden md:block bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 border-b border-border/50">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 hover:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                    <span>{companyInfo.phone_number}</span>
                  </div>
                  <div className="flex items-center space-x-2 hover:text-primary transition-colors">
                    <MapPin className="w-4 h-4" />
                    <span>{companyInfo.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 hover:text-primary transition-colors">
                    <Clock className="w-4 h-4" />
                    <span>{companyInfo.time}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span>Ijtimoiy tarmoqlar:</span>
                  <div className="flex items-center space-x-3">
                    {companyInfo.social_telegram && (
                      <a
                        href={`https://t.me/${companyInfo.social_telegram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-500 transition-colors duration-200"
                      >
                        Telegram
                      </a>
                    )}
                    {companyInfo.social_instagram && (
                      <a
                        href={`https://instagram.com/${companyInfo.social_instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-pink-500 transition-colors duration-200"
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
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
            >
              {companyInfo?.logo_url && (
                <div className="relative">
                  <Image
                    src={companyInfo.logo_url || "/placeholder.svg"}
                    alt={companyInfo.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-lg group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              )}
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{companyInfo?.name || "JamolStroy"}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Qurilish materiallari</p>
              </div>
            </button>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Mahsulotlarni qidiring..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all duration-200 backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none" />
                </div>
              </form>
            </div>

            {/* Cart Button */}
            <button
              onClick={handleCartClick}
              className="relative p-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md group"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          </div>

          {/* Search Bar - Mobile */}
          <div className="md:hidden mt-4">
            <form onSubmit={handleSearch}>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Mahsulotlarni qidiring..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all duration-200"
                />
              </div>
            </form>
          </div>
        </div>

        {/* AI-Powered Desktop Navigation Tabs */}
        <div className="hidden md:block border-t border-border bg-gradient-to-r from-background via-muted/10 to-background">
          <div className="container mx-auto px-4">
            <nav className="flex justify-center space-x-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.path
                const Icon = item.icon

                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`relative flex items-center space-x-2 px-6 py-4 rounded-t-lg transition-all duration-300 group overflow-hidden ${
                      isActive
                        ? "text-primary bg-gradient-to-b from-primary/10 to-transparent border-b-2 border-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-b hover:from-muted/30 hover:to-transparent"
                    }`}
                  >
                    {/* Animated background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r transition-all duration-300 ${
                        isActive
                          ? "from-primary/5 via-primary/10 to-primary/5 opacity-100"
                          : "from-transparent via-muted/20 to-transparent opacity-0 group-hover:opacity-100"
                      }`}
                    />

                    {/* Shimmer effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-transform duration-1000 ${
                        isActive ? "translate-x-full" : "-translate-x-full group-hover:translate-x-full"
                      }`}
                    />

                    <Icon
                      className={`w-5 h-5 relative z-10 transition-all duration-200 ${
                        isActive ? "scale-110" : "group-hover:scale-105"
                      }`}
                    />
                    <span
                      className={`font-medium relative z-10 transition-all duration-200 ${
                        isActive ? "font-semibold" : ""
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary to-primary/80 rounded-full" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={showCartSidebar} onClose={() => setShowCartSidebar(false)} />
    </>
  )
}
