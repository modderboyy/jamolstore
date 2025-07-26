"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Bell, X, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import Image from "next/image"

interface SearchSuggestion {
  suggestion: string
  type: string
  count: number
}

interface CompanyInfo {
  name: string
  phone_number: string
  address: string
  time: string
}

export function TopBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { uniqueItemsCount } = useCart()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  useEffect(() => {
    if (showMobileSearch && mobileSearchRef.current) {
      mobileSearchRef.current.focus()
    }
  }, [showMobileSearch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase.from("company").select("*").eq("is_active", true).single()

      if (error) throw error
      setCompanyInfo(data)
    } catch (error) {
      console.error("Company info error:", error)
    }
  }

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const { data, error } = await supabase.rpc("get_search_suggestions", {
        search_term: query,
        limit_count: 8,
      })

      if (error) throw error
      setSuggestions(data || [])
    } catch (error) {
      console.error("Suggestions error:", error)
      setSuggestions([])
    }
  }

  const handleSearchChange = (value: string) => {
    // Clean the search query to remove special characters that might cause issues
    const cleanValue = value.replace(/[^\w\s\u0400-\u04FF]/g, "")
    setSearchQuery(cleanValue)
    fetchSuggestions(cleanValue)
    setShowSuggestions(true)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      setShowMobileSearch(false)
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    setShowMobileSearch(false)
    router.push(`/?search=${encodeURIComponent(suggestion)}`)
  }

  const handleMobileSearchToggle = () => {
    setShowMobileSearch(!showMobileSearch)
    if (showMobileSearch) {
      setSearchQuery("")
      setShowSuggestions(false)
    }
  }

  return (
    <>
      {/* Desktop Top Bar */}
      <div className="hidden md:block bg-background border-b border-border sticky top-0 z-50">
        {/* Company Info Bar */}
        {companyInfo && (
          <div className="bg-primary/5 border-b border-primary/10">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-6">
                  <span className="font-medium">{companyInfo.name}</span>
                  <span>📞 {companyInfo.phone_number}</span>
                  <span>📍 {companyInfo.address}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>🕒 {companyInfo.time}</span>
                  {user && (
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <span>Xush kelibsiz, {user.first_name}!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push("/")} className="flex items-center space-x-2">
                <Image src="/placeholder-logo.svg" alt="JamolStroy" width={40} height={40} className="w-10 h-10" />
                <span className="text-xl font-bold text-primary">JamolStroy</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Mahsulot, ishchi yoki xizmat qidirish..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                    className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all duration-200"
                  />
                </div>

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between"
                      >
                        <span>{suggestion.suggestion}</span>
                        <span className="text-xs text-muted-foreground capitalize">{suggestion.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-background border-b border-border sticky top-0 z-50">
        <div className="px-4 py-3">
          {!showMobileSearch ? (
            <div className="flex items-center justify-between">
              {/* Mobile Search Button */}
              <button
                onClick={handleMobileSearchToggle}
                className="flex-1 flex items-center space-x-3 bg-muted rounded-lg px-3 py-2 mr-4"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Qidirish...</span>
              </button>

              {/* Notifications */}
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex-1" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                    <input
                      ref={mobileSearchRef}
                      type="text"
                      placeholder="Qidirish..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                      className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Mobile Search Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion.suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm">{suggestion.suggestion}</span>
                          <span className="text-xs text-muted-foreground capitalize">{suggestion.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              </div>
              <button onClick={handleMobileSearchToggle} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
