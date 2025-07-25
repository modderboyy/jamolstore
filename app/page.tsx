"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { CategoryBar } from "@/components/layout/category-bar"
import { AdBanner } from "@/components/layout/ad-banner"
import { ProductCard } from "@/components/ui/product-card"
import { Search, Package, TrendingUp, Star, Filter } from "lucide-react"

interface Product {
  id: string
  name_uz: string
  price: number
  unit: string
  images: string[]
  is_featured: boolean
  is_popular: boolean
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
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("category"))
  const [sortBy, setSortBy] = useState<string>("featured")

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [searchQuery, selectedCategory, sortBy])

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

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(name_uz)
        `)
        .eq("is_available", true)

      // Apply search filter with transliteration support
      if (searchQuery) {
        const transliteratedQuery = transliterate(searchQuery)
        query = query.or(`
          name_uz.ilike.%${searchQuery}%,
          description_uz.ilike.%${searchQuery}%,
          name_uz.ilike.%${transliteratedQuery}%,
          description_uz.ilike.%${transliteratedQuery}%
        `)
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory)
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

      // Add mock ratings for display
      const productsWithRatings = (data || []).map((product) => ({
        ...product,
        average_rating: 4.0 + Math.random() * 1.0,
        review_count: Math.floor(Math.random() * 100) + 1,
      }))

      setProducts(productsWithRatings)
    } catch (error) {
      console.error("Products fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Simple transliteration function for Cyrillic to Latin
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
      л: "л",
      м: "м",
      н: "н",
      о: "о",
      п: "п",
      р: "р",
      с: "с",
      т: "т",
      у: "u",
      ф: "f",
      х: "x",
      ц: "ts",
      ч: "ch",
      ш: "ш",
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

    const latinToCyrillic: { [key: string]: string } = {
      a: "а",
      b: "б",
      v: "в",
      g: "г",
      d: "д",
      e: "е",
      yo: "ё",
      zh: "ж",
      z: "з",
      i: "и",
      y: "й",
      k: "к",
      l: "л",
      m: "м",
      n: "н",
      o: "о",
      p: "п",
      r: "р",
      s: "с",
      t: "т",
      u: "у",
      f: "ф",
      x: "х",
      ts: "ц",
      ch: "ч",
      sh: "ш",
      shch: "щ",
      yu: "ю",
      ya: "я",
    }

    let result = text

    // Try Cyrillic to Latin first
    for (const [cyrillic, latin] of Object.entries(cyrillicToLatin)) {
      result = result.replace(new RegExp(cyrillic, "g"), latin)
    }

    // If no change, try Latin to Cyrillic
    if (result === text) {
      for (const [latin, cyrillic] of Object.entries(latinToCyrillic)) {
        result = result.replace(new RegExp(latin, "g"), cyrillic)
      }
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
    router.push(`/product/${productId}`)
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
                <ProductCard product={product} onQuickView={handleProductView} />
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
                    <ProductCard product={product} onQuickView={handleProductView} />
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
                    <ProductCard product={product} onQuickView={handleProductView} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
