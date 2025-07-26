"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { TopBar } from "@/components/layout/top-bar"
import { CategoryBar } from "@/components/layout/category-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ProductCard } from "@/components/ui/product-card"
import { AdBanner } from "@/components/layout/ad-banner"
import { ContactFab } from "@/components/ui/contact-fab"
import { Search, Filter, Grid, List, Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category_id: string
  category_name?: string
  stock_quantity: number
  is_rental?: boolean
  rental_price_per_day?: number
}

interface SearchResult {
  type: string
  id: string
  title: string
  description: string
  price: number
  image_url: string
  relevance_score: number
}

export default function HomePage() {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [mounted, setMounted] = useState(false)

  // Debounce search query for real-time search
  const debouncedSearchQuery = useDebounce(searchQuery, 150)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!mounted) return

    try {
      setIsLoading(true)

      // Fetch categories
      const categoriesResponse = await fetch("/api/categories")
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories || [])
      }

      // Fetch products
      const productsResponse = await fetch("/api/products")
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.products || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [mounted])

  // Search function
  const performSearch = useCallback(
    async (query: string) => {
      if (!mounted || !query.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      try {
        setIsSearching(true)
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.results || [])
        }
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [mounted],
  )

  // Initial data fetch
  useEffect(() => {
    if (mounted) {
      fetchData()
    }
  }, [mounted, fetchData])

  // Auto-refresh every 30 seconds when not searching
  useEffect(() => {
    if (!mounted || debouncedSearchQuery) return

    const interval = setInterval(() => {
      fetchData()
    }, 30000)

    return () => clearInterval(interval)
  }, [mounted, debouncedSearchQuery, fetchData])

  // Real-time search
  useEffect(() => {
    if (mounted) {
      performSearch(debouncedSearchQuery)
    }
  }, [debouncedSearchQuery, mounted, performSearch])

  const handleAddToCart = (product: Product | SearchResult) => {
    if (!mounted) return

    const cartItem = {
      id: product.id,
      name: "title" in product ? product.title : product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1,
    }
    addToCart(cartItem)
  }

  const handleProductClick = (productId: string) => {
    if (!mounted) return
    router.push(`/product/${productId}`)
  }

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category_id === selectedCategory)
    : products

  const displayProducts = debouncedSearchQuery ? searchResults : filteredProducts

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Search Bar */}
      <div className="sticky top-16 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Mahsulotlarni qidiring..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>

              <button className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Bar - Hide when searching */}
      {!debouncedSearchQuery && (
        <CategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      )}

      {/* Search Results Info */}
      {debouncedSearchQuery && (
        <div className="container mx-auto px-4 py-2">
          <p className="text-sm text-muted-foreground">
            {isSearching
              ? "Qidirilmoqda..."
              : `"${debouncedSearchQuery}" uchun ${searchResults.length} ta natija topildi`}
          </p>
        </div>
      )}

      {/* Ad Banner */}
      <AdBanner />

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayProducts.length > 0 ? (
          <div
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: "title" in product ? product.title : product.name,
                  description: product.description,
                  price: product.price,
                  image_url: product.image_url,
                  category_name: "category_name" in product ? product.category_name : undefined,
                  stock_quantity: "stock_quantity" in product ? product.stock_quantity : 0,
                  is_rental: "is_rental" in product ? product.is_rental : false,
                  rental_price_per_day: "rental_price_per_day" in product ? product.rental_price_per_day : undefined,
                }}
                viewMode={viewMode}
                onAddToCart={() => handleAddToCart(product)}
                onClick={() => handleProductClick(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {debouncedSearchQuery ? "Hech narsa topilmadi" : "Mahsulotlar yuklanmoqda..."}
            </p>
          </div>
        )}
      </div>

      <ContactFab />
      <BottomNavigation />
    </div>
  )
}
