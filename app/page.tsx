"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/ui/product-card"
import { DraggableFab } from "@/components/ui/draggable-fab"
import { AdBanner } from "@/components/layout/ad-banner"
import { CategoryBar } from "@/components/layout/category-bar"
import { Search, TrendingUp, Star, Eye } from "lucide-react"
import Link from "next/link"
import { createSupabaseClient } from "@/lib/supabase"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  view_count: number
  rating: number
  similarity?: number
}

interface SearchSuggestion {
  suggestion: string
  category: string
  count: number
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const debouncedSearchQuery = useDebounce(searchQuery, 200)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Handle real-time search
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery)
    } else {
      setSearchResults([])
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [debouncedSearchQuery])

  const loadInitialData = async () => {
    try {
      const supabase = createSupabaseClient()

      // Load featured products
      const { data: featured } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8)

      // Load trending products (most viewed)
      const { data: trending } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("view_count", { ascending: false })
        .limit(6)

      setFeaturedProducts(featured || [])
      setTrendingProducts(trending || [])
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  const performSearch = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search/instant?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.products || [])
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ad Banner */}
      <AdBanner />

      {/* Category Bar */}
      <CategoryBar />

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Search Section */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Mahsulotlarni qidiring..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-12 h-12 text-lg"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    ✕
                  </Button>
                )}
              </div>

              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion.suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center justify-between"
                        >
                          <span>{suggestion.suggestion}</span>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.category}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {isSearching && <div className="mt-4 text-center text-gray-500">Qidirilmoqda...</div>}
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Qidiruv natijalari ({searchResults.length})</h2>
              <Button variant="outline" onClick={clearSearch}>
                Tozalash
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Trending Products */}
        {!searchQuery && trendingProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold">Mashhur mahsulotlar</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <Link href={`/product/${product.id}`}>
                      <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                        <img
                          src={product.image_url || "/placeholder.svg?height=200&width=200"}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-blue-600">{product.price.toLocaleString()} so'm</span>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {product.view_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {product.rating || 0}
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Featured Products */}
        {!searchQuery && featuredProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Yangi mahsulotlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hech narsa topilmadi</h3>
              <p className="text-gray-600 mb-4">"{searchQuery}" bo'yicha hech qanday mahsulot topilmadi</p>
              <Button onClick={clearSearch}>Qidiruvni tozalash</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Draggable FAB */}
      <DraggableFab />
    </div>
  )
}
