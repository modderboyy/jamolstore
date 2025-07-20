"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ProductCard } from "@/components/ui/product-card"
import { TopBar } from "@/components/layout/top-bar"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Filter } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useTelegram } from "@/contexts/TelegramContext"

interface Product {
  id: string
  name_uz: string
  price: number
  unit: string
  images: string[]
  is_featured: boolean
  is_popular: boolean
  stock_quantity: number
  min_order_quantity: number
  delivery_limit: number
  delivery_price: number
  description_uz: string
  rating?: number
  review_count?: number
  category: {
    name_uz: string
  }
}

interface Category {
  id: string
  name_uz: string
  icon_name: string
}

export default function CatalogPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const { webApp } = useTelegram()

  const categoryId = searchParams.get("category")
  const searchQuery = searchParams.get("search") || ""
  const isPopular = searchParams.get("popular") === "true"

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filter states
  const [priceFrom, setPriceFrom] = useState("")
  const [priceTo, setPriceTo] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, searchQuery, isPopular, sortBy, priceFrom, priceTo])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("sort_order")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Kategoriyalarni yuklashda xatolik:", error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(name_uz)
        `)
        .eq("is_available", true)

      // Category filter
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory)
      }

      // Popular filter
      if (isPopular) {
        query = query.eq("is_popular", true)
      }

      // Search filter
      if (searchQuery) {
        query = query.or(`name_uz.ilike.%${searchQuery}%,description_uz.ilike.%${searchQuery}%`)
      }

      // Price filter
      if (priceFrom) {
        query = query.gte("price", Number.parseFloat(priceFrom))
      }
      if (priceTo) {
        query = query.lte("price", Number.parseFloat(priceTo))
      }

      // Sorting
      switch (sortBy) {
        case "price_asc":
          query = query.order("price", { ascending: true })
          break
        case "price_desc":
          query = query.order("price", { ascending: false })
          break
        case "popular":
          query = query.order("view_count", { ascending: false })
          break
        case "newest":
        default:
          query = query.order("created_at", { ascending: false })
          break
      }

      const { data, error } = await query.limit(50)

      if (error) throw error

      // Add mock ratings
      const productsWithRatings = (data || []).map((product) => ({
        ...product,
        rating: 4.0 + Math.random() * 1.0,
        review_count: Math.floor(Math.random() * 100) + 1,
      }))

      setProducts(productsWithRatings)
    } catch (error) {
      console.error("Mahsulotlarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickView = (productId: string) => {
    router.push(`/product/${productId}`)
  }

  const applyFilters = () => {
    setShowFilters(false)
    fetchProducts()
  }

  const clearFilters = () => {
    setPriceFrom("")
    setPriceTo("")
    setSortBy("newest")
    setSelectedCategory(null)
    setShowFilters(false)

    router.push("/catalog")
  }

  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name_uz

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {selectedCategoryName || (isPopular ? "Mashhur mahsulotlar" : "Katalog")}
              </h1>
              <p className="text-sm text-muted-foreground">{products.length} ta mahsulot</p>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="p-3 rounded-xl hover:bg-muted transition-colors shadow-sm border border-border"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Barchasi
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category.name_uz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="product-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 animate-pulse border border-border">
                <div className="aspect-square bg-muted rounded-xl mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-6 bg-muted rounded mb-3"></div>
                <div className="h-9 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Mahsulot topilmadi</h3>
            <p className="text-muted-foreground mb-4">Qidiruv so'zini o'zgartiring yoki boshqa kategoriyani tanlang</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Barchasini ko'rsatish
            </button>
          </div>
        )}
      </div>

      <BottomNavigation />

      {/* Filters Bottom Sheet - Full Screen */}
      <BottomSheet isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filtrlar" height="full">
        <div className="p-6 h-full flex flex-col">
          <div className="flex-1 space-y-6">
            {/* Price Range */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Narx oralig'i</h3>
              <div className="flex space-x-3">
                <input
                  type="number"
                  placeholder="Dan"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  className="flex-1 px-3 py-3 bg-muted rounded-xl border-0 focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="number"
                  placeholder="Gacha"
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  className="flex-1 px-3 py-3 bg-muted rounded-xl border-0 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Saralash</h3>
              <div className="space-y-2">
                {[
                  { value: "newest", label: "Eng yangi" },
                  { value: "price_asc", label: "Narx: arzondan qimmatga" },
                  { value: "price_desc", label: "Narx: qimmatdan arzonga" },
                  { value: "popular", label: "Mashhur" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-primary"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-6 border-t border-border">
            <button
              onClick={clearFilters}
              className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors"
            >
              Tozalash
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Qo'llash
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
