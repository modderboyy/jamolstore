"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { CategoryBar } from "@/components/layout/category-bar"
import { AdBanner } from "@/components/layout/ad-banner"
import { ProductCard } from "@/components/ui/product-card"
import { DraggableFAB } from "@/components/ui/draggable-fab"
import { QuantityModal } from "@/components/ui/quantity-modal"
import { Search, Package, TrendingUp, Star, Filter } from "lucide-react"

interface Product {
  id: string
  name_uz: string
  price: number
  unit: string
  images: string[]
  is_featured: boolean
  is_popular: boolean
  stock_quantity: number
  available_quantity: number
  has_delivery: boolean
  delivery_price: number
  delivery_limit: number
  product_type: "sale" | "rental"
  rental_price_per_unit?: number
  category: {
    name_uz: string
  }
  average_rating?: number
  review_count?: number
}

interface Category {
  id: string
  name_uz: string
  icon_name: string
}

export default function HomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [popularSearches, setPopularSearches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("category"))
  const [sortBy, setSortBy] = useState<string>("featured")
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all")
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchProducts()
    fetchPopularSearches()
  }, [searchQuery, selectedCategory, sortBy, deliveryFilter])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name_uz, icon_name")
        .eq("is_active", true)
        .order("name_uz")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Categories fetch error:", error)
    }
  }

  const fetchPopularSearches = async () => {
    try {
      const { data, error } = await supabase.rpc("get_popular_searches", { limit_count: 8 })

      if (error) throw error
      setPopularSearches(data || [])
    } catch (error) {
      console.error("Popular searches error:", error)
    }
  }

  const calculateAvailableQuantity = async (productId: string, stockQuantity: number) => {
    try {
      const { data: soldData, error: soldError } = await supabase
        .from("order_items")
        .select(`
          quantity,
          orders!inner(status)
        `)
        .eq("product_id", productId)
        .in("orders.status", ["confirmed", "processing", "shipped", "delivered"])

      if (soldError) throw soldError

      const soldQuantity = (soldData || []).reduce((sum, item) => sum + item.quantity, 0)
      return Math.max(0, stockQuantity - soldQuantity)
    } catch (error) {
      console.error("Available quantity calculation error:", error)
      return stockQuantity
    }
  }

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(name_uz)
        `)
        .eq("is_available", true)
        .gt("stock_quantity", 0)

      // Apply search filter
      if (searchQuery) {
        const transliteratedQuery = transliterate(searchQuery)
        query = query.or(
          `name_uz.ilike.%${searchQuery}%,description_uz.ilike.%${searchQuery}%,name_uz.ilike.%${transliteratedQuery}%,description_uz.ilike.%${transliteratedQuery}%`,
        )
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory)
      }

      // Apply delivery filter
      if (deliveryFilter === "available") {
        query = query.eq("has_delivery", true)
      } else if (deliveryFilter === "free") {
        query = query.eq("has_delivery", true).eq("delivery_price", 0)
      } else if (deliveryFilter === "none") {
        query = query.eq("has_delivery", false)
      }

      // Apply sorting
      switch (sortBy) {
        case "featured":
          query = query.order("is_featured", { ascending: false }).order("is_popular", { ascending: false })
          break
        case "popular":
          query = query.order("is_popular", { ascending: false }).order("view_count", { ascending: false })
          break
        case "price_low":
          query = query.order("price", { ascending: true })
          break
        case "price_high":
          query = query.order("price", { ascending: false })
          break
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        default:
          query = query.order("is_featured", { ascending: false })
      }

      query = query.limit(50)

      const { data, error } = await query

      if (error) throw error

      const productsWithAvailability = await Promise.all(
        (data || []).map(async (product) => {
          const availableQuantity = await calculateAvailableQuantity(product.id, product.stock_quantity)
          return {
            ...product,
            available_quantity: availableQuantity,
            average_rating: 4.0 + Math.random() * 1.0,
            review_count: Math.floor(Math.random() * 100) + 1,
          }
        }),
      )

      const availableProducts = productsWithAvailability.filter((product) => product.available_quantity > 0)

      setProducts(availableProducts)
    } catch (error) {
      console.error("Products fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const transliterate = (text: string) => {
    const cyrillicToLatin: { [key: string]: string } = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "yo",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "x",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "shch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
      А: "A",
      Б: "B",
      В: "V",
      Г: "G",
      Д: "D",
      Е: "E",
      Ё: "Yo",
      Ж: "Zh",
      З: "Z",
      И: "I",
      Й: "Y",
      К: "K",
      Л: "L",
      М: "M",
      Н: "N",
      О: "O",
      П: "P",
      Р: "R",
      С: "S",
      Т: "T",
      У: "U",
      Ф: "F",
      Х: "X",
      Ц: "Ts",
      Ч: "Ch",
      Ш: "Sh",
      Щ: "Shch",
      Ъ: "",
      Ы: "Y",
      Ь: "",
      Э: "E",
      Ю: "Yu",
      Я: "Ya",
    }

    let result = text
    for (const [cyrillic, latin] of Object.entries(cyrillicToLatin)) {
      result = result.replace(new RegExp(cyrillic, "g"), latin)
    }
    return result
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (categoryId) params.set("category", categoryId)

    const queryString = params.toString()
    router.push(queryString ? `/?${queryString}` : "/")
  }

  const handleProductView = (productId: string) => {
    // Increment view count
    supabase.rpc("increment_product_view", { product_id_param: productId })
    router.push(`/product/${productId}`)
  }

  const handleAddToCart = (product: Product) => {
    setSelectedProduct(product)
    setShowQuantityModal(true)
  }

  const handleSearchExample = (query: string) => {
    setSearchQuery(query)
    router.push(`/?search=${encodeURIComponent(query)}`)
  }

  const getSectionTitle = () => {
    if (searchQuery) {
      return `"${searchQuery}" bo'yicha qidiruv natijalari`
    }
    if (selectedCategory) {
      const category = categories.find((c) => c.id === selectedCategory)
      return category ? `${category.name_uz} kategoriyasi` : "Mahsulotlar"
    }
    return "Barcha mahsulotlar"
  }

  const getSectionIcon = () => {
    if (searchQuery) return Search
    if (selectedCategory) return Filter
    return Package
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />
      <AdBanner />

      <div className="container mx-auto px-4 py-6">
        {/* Search Examples - Show when no search query */}
        {!searchQuery && !selectedCategory && popularSearches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Mashhur qidiruvlar</h3>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchExample(search.query)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
                >
                  {search.query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Quick Access */}
        {!searchQuery && !selectedCategory && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Kategoriyalar</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.slice(0, 8).map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="p-3 bg-card rounded-lg border border-border hover:border-primary/20 transition-colors text-left"
                >
                  <span className="font-medium text-sm">{category.name_uz}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {(() => {
              const Icon = getSectionIcon()
              return <Icon className="w-6 h-6 text-primary" />
            })()}
            <div>
              <h2 className="text-xl font-bold">{getSectionTitle()}</h2>
              <p className="text-sm text-muted-foreground">
                {loading ? "Yuklanmoqda..." : `${products.length} ta mahsulot topildi`}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            {/* Delivery Filter */}
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 text-sm"
            >
              <option value="all">Barchasi</option>
              <option value="available">Yetkazib berish mavjud</option>
              <option value="free">Tekin yetkazib berish</option>
              <option value="none">Yetkazib berish yo'q</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 text-sm"
            >
              <option value="featured">Tavsiya etilgan</option>
              <option value="popular">Mashhur</option>
              <option value="newest">Yangi</option>
              <option value="price_low">Arzon narx</option>
              <option value="price_high">Qimmat narx</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Hech narsa topilmadi</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `"${searchQuery}" bo'yicha hech qanday mahsulot topilmadi`
                : "Bu kategoriyada mahsulotlar yo'q"}
            </p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory(null)
                setDeliveryFilter("all")
                router.push("/")
              }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Barcha mahsulotlarni ko'rish
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product, index) => (
              <div key={product.id} className="product-card" style={{ animationDelay: `${index * 50}ms` }}>
                <ProductCard product={product} onQuickView={handleProductView} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        )}

        {/* Featured Products Section */}
        {!searchQuery && !selectedCategory && (
          <div className="mt-12">
            <div className="flex items-center space-x-3 mb-6">
              <Star className="w-6 h-6 text-yellow-500" />
              <div>
                <h2 className="text-xl font-bold">Tavsiya etilgan mahsulotlar</h2>
                <p className="text-sm text-muted-foreground">Eng yaxshi takliflar</p>
              </div>
            </div>

            <div className="product-grid">
              {products
                .filter((product) => product.is_featured)
                .slice(0, 10)
                .map((product, index) => (
                  <div
                    key={`featured-${product.id}`}
                    className="product-card"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProductCard product={product} onQuickView={handleProductView} onAddToCart={handleAddToCart} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Popular Products Section */}
        {!searchQuery && !selectedCategory && (
          <div className="mt-12">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <div>
                <h2 className="text-xl font-bold">Mashhur mahsulotlar</h2>
                <p className="text-sm text-muted-foreground">Ko'p sotilayotgan mahsulotlar</p>
              </div>
            </div>

            <div className="product-grid">
              {products
                .filter((product) => product.is_popular)
                .slice(0, 10)
                .map((product, index) => (
                  <div
                    key={`popular-${product.id}`}
                    className="product-card"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProductCard product={product} onQuickView={handleProductView} onAddToCart={handleAddToCart} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
      <DraggableFAB />

      {/* Quantity Modal */}
      <QuantityModal isOpen={showQuantityModal} onClose={() => setShowQuantityModal(false)} product={selectedProduct} />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .product-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        .product-card {
          animation: slideInUp 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
