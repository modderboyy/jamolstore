"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { CategoryBar } from "@/components/layout/category-bar"
import { AdBanner } from "@/components/layout/ad-banner"
import { ProductCard } from "@/components/ui/product-card"
import { DraggableFab } from "@/components/ui/draggable-fab"
import { supabase } from "@/lib/supabase"
import { useDebounce } from "@/hooks/use-debounce"
import { Search, Loader2 } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category_id: string
  category_name: string
  is_available: boolean
  stock_quantity: number
  similarity_score?: number
}

interface Category {
  id: string
  name: string
  icon: string
  is_active: boolean
}

interface SearchSuggestion {
  suggestion: string
  category: string
  match_type: string
}

export default function HomePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Debounce search query for real-time search
  const debouncedSearchQuery = useDebounce(searchQuery, 200)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery)
    } else {
      setSearchResults([])
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [debouncedSearchQuery])

  useEffect(() => {
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory)
    } else {
      fetchProducts()
    }
  }, [selectedCategory])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchCategories(), fetchProducts()])
    } catch (error) {
      console.error("Error fetching initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq("is_available", true)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      const formattedProducts =
        data?.map((product) => ({
          ...product,
          category_name: product.categories?.name || "Kategoriya yo'q",
        })) || []

      setProducts(formattedProducts)
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchProductsByCategory = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq("category_id", categoryId)
        .eq("is_available", true)
        .order("name")

      if (error) throw error

      const formattedProducts =
        data?.map((product) => ({
          ...product,
          category_name: product.categories?.name || "Kategoriya yo'q",
        })) || []

      setProducts(formattedProducts)
    } catch (error) {
      console.error("Error fetching products by category:", error)
    }
  }

  const performSearch = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search/instant?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.products || [])
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      } else {
        console.error("Search error:", data.error)
      }
    } catch (error) {
      console.error("Search request error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    performSearch(suggestion)
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setSearchQuery("")
    setSearchResults([])
    setShowSuggestions(false)
  }

  const displayProducts = searchQuery.trim() ? searchResults : products

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Search Section */}
      <div className="sticky top-16 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Mahsulotlarni qidiring..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg mt-1 shadow-lg z-50">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{suggestion.suggestion}</span>
                      <span className="text-xs text-muted-foreground capitalize">{suggestion.match_type}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      <AdBanner />

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        {searchQuery.trim() && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              "{searchQuery}" uchun {displayProducts.length} ta natija topildi
            </p>
          </div>
        )}

        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image_url}
                category={product.category_name}
                inStock={product.stock_quantity > 0}
                onClick={() => router.push(`/product/${product.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery.trim() ? "Hech narsa topilmadi" : "Mahsulotlar yuklanmoqda..."}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery.trim() ? "Boshqa kalit so'zlar bilan qidirib ko'ring" : "Iltimos, biroz kuting"}
            </p>
          </div>
        )}
      </div>

      <DraggableFab />
      <BottomNavigation />
    </div>
  )
}
