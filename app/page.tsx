"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { supabase } from "@/lib/supabase"
import { useDebounce } from "@/hooks/use-debounce"
import { TopBar } from "@/components/layout/top-bar"
import { CategoryBar } from "@/components/layout/category-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ProductCard } from "@/components/ui/product-card"
import { AdBanner } from "@/components/layout/ad-banner"
import { ContactFab } from "@/components/ui/contact-fab"
import { Search, Grid, List, Sparkles } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  rental_price: number
  image_url: string
  category: string
  stock_quantity: number
  view_count: number
  is_rental: boolean
  is_active: boolean
  created_at: string
}

interface SearchResult {
  type: string
  id: string
  title: string
  description: string
  price: number
  image_url: string
  category: string
  relevance_score: number
}

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { cart } = useCart()
  const { isTelegramWebApp } = useTelegram()

  const [products, setProducts] = useState<Product[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isSearching, setIsSearching] = useState(false)

  // Real-time search with faster debounce
  const debouncedSearchQuery = useDebounce(searchQuery, 150)

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      let query = supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false })

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory])

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    try {
      setIsSearching(true)
      const { data, error } = await supabase.rpc("search_all_content", {
        search_query: query.trim(),
      })

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Auto-refresh every 30 seconds when not searching
  useEffect(() => {
    if (!debouncedSearchQuery) {
      const interval = setInterval(() => {
        fetchProducts()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [debouncedSearchQuery, fetchProducts])

  // Initial load
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Handle search
  useEffect(() => {
    performSearch(debouncedSearchQuery)
  }, [debouncedSearchQuery, performSearch])

  // Handle category change
  useEffect(() => {
    if (!searchQuery) {
      fetchProducts()
    }
  }, [selectedCategory, searchQuery, fetchProducts])

  const displayProducts = searchQuery ? searchResults : products
  const isShowingSearchResults = searchQuery.length > 0

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Search Bar */}
      <div className="bg-card border-b border-border sticky top-16 z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Mahsulotlarni qidiring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Bar */}
      {!isShowingSearchResults && (
        <CategoryBar selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      )}

      {/* View Controls */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isShowingSearchResults ? (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Search className="w-4 h-4" />
                  <span>
                    {searchResults.length} ta natija "{searchQuery}" uchun
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span>{products.length} ta mahsulot</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Banner */}
      <AdBanner />

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              {isShowingSearchResults ? (
                <Search className="w-8 h-8 text-muted-foreground" />
              ) : (
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isShowingSearchResults ? "Hech narsa topilmadi" : "Mahsulotlar yo'q"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isShowingSearchResults
                ? `"${searchQuery}" bo'yicha hech qanday mahsulot topilmadi`
                : "Hozircha bu kategoriyada mahsulotlar yo'q"}
            </p>
            {isShowingSearchResults && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Barcha mahsulotlarni ko'rish
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-4"
            }
          >
            {displayProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={
                  isShowingSearchResults
                    ? {
                        id: item.id,
                        name: item.title,
                        description: item.description,
                        price: item.price,
                        rental_price: 0,
                        image_url: item.image_url,
                        category: item.category,
                        stock_quantity: 1,
                        view_count: 0,
                        is_rental: false,
                        is_active: true,
                        created_at: new Date().toISOString(),
                      }
                    : item
                }
                viewMode={viewMode}
                showRelevanceScore={isShowingSearchResults ? item.relevance_score : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contact FAB */}
      <ContactFab />

      <BottomNavigation />
    </div>
  )
}
