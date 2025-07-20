"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { supabase } from "@/lib/supabase"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ProductCard } from "@/components/ui/product-card"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { TopBar } from "@/components/layout/top-bar"
import { CategoryBar } from "@/components/layout/category-bar"
import { AdBanner } from "@/components/layout/ad-banner"
import { CartBar } from "@/components/layout/cart-bar"
import { useRouter } from "next/navigation"
import { Star, X, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Truck } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import Image from "next/image"

interface Product {
  id: string
  name_uz: string
  name_ru: string
  description_uz: string
  price: number
  unit: string
  images: string[]
  is_featured: boolean
  is_popular: boolean
  delivery_limit: number
  delivery_price: number
  stock_quantity: number
  min_order_quantity: number
  view_count: number
  rating?: number
  review_count?: number
  category: {
    name_uz: string
  }
}

interface Review {
  id: string
  rating: number
  comment: string
  reviewer_name: string
  created_at: string
}

export default function HomePage() {
  const { user } = useAuth()
  const { webApp, isReady } = useTelegram()
  const router = useRouter()
  const { addToCart } = useCart()
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productReviews, setProductReviews] = useState<Review[]>([])
  const [showProductSheet, setShowProductSheet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [imageAutoPlay, setImageAutoPlay] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchPopularProducts()
    fetchAllProducts()
  }, [])

  useEffect(() => {
    // Auto dark/light mode detection
    const detectTheme = () => {
      if (window.Telegram?.WebApp) {
        const tgTheme = window.Telegram.WebApp.colorScheme
        document.documentElement.classList.toggle("dark", tgTheme === "dark")
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        document.documentElement.classList.toggle("dark", prefersDark)
      }
    }

    detectTheme()

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", detectTheme)

    return () => mediaQuery.removeEventListener("change", detectTheme)
  }, [])

  const fetchPopularProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name_uz)
        `)
        .eq("is_popular", true)
        .eq("is_available", true)
        .order("view_count", { ascending: false })
        .limit(10)

      if (error) throw error

      // Add mock ratings for demo
      const productsWithRatings = (data || []).map((product) => ({
        ...product,
        rating: 4.2 + Math.random() * 0.8,
        review_count: Math.floor(Math.random() * 50) + 5,
      }))

      setPopularProducts(productsWithRatings)
    } catch (error) {
      console.error("Mashhur mahsulotlarni yuklashda xatolik:", error)
    }
  }

  const fetchAllProducts = async (offset = 0) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name_uz)
        `)
        .eq("is_available", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + 29)

      if (error) throw error

      // Add mock ratings for demo
      const productsWithRatings = (data || []).map((product) => ({
        ...product,
        rating: 4.0 + Math.random() * 1.0,
        review_count: Math.floor(Math.random() * 100) + 1,
      }))

      if (offset === 0) {
        setAllProducts(productsWithRatings)
      } else {
        setAllProducts((prev) => [...prev, ...productsWithRatings])
      }

      setHasMore((data || []).length === 30)
    } catch (error) {
      console.error("Mahsulotlarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchProductReviews = async (productId: string) => {
    try {
      // Mock reviews for demo
      const mockReviews: Review[] = [
        {
          id: "1",
          rating: 5,
          comment: "Juda sifatli mahsulot, tavsiya qilaman!",
          reviewer_name: "Aziz Karimov",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "2",
          rating: 4,
          comment: "Yaxshi sifat, tez yetkazib berishdi.",
          reviewer_name: "Malika Tosheva",
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: "3",
          rating: 5,
          comment: "Narxi ham mos, sifati ham yaxshi.",
          reviewer_name: "Bobur Aliyev",
          created_at: new Date(Date.now() - 259200000).toISOString(),
        },
      ]

      setProductReviews(mockReviews)
    } catch (error) {
      console.error("Sharhlarni yuklashda xatolik:", error)
      setProductReviews([])
    }
  }

  const loadMoreProducts = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    fetchAllProducts(allProducts.length)
  }

  const handleQuickView = async (productId: string) => {
    console.log("Quick view clicked for product:", productId)

    const product = [...popularProducts, ...allProducts].find((p) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      setQuantity(product.min_order_quantity || 1)
      setSelectedImageIndex(0)

      // View count ni oshirish
      try {
        await supabase
          .from("products")
          .update({ view_count: (product.view_count || 0) + 1 })
          .eq("id", productId)

        await supabase.from("product_views").insert({
          product_id: productId,
          user_id: user?.id || null,
          session_id: user ? null : generateSessionId(),
        })
      } catch (error) {
        console.error("View count yangilashda xatolik:", error)
      }

      await fetchProductReviews(productId)
      setShowProductSheet(true)

      // Auto image change
      if (product.images && product.images.length > 1) {
        const interval = setInterval(() => {
          setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
        }, 3000)
        setImageAutoPlay(interval)
      }
    }
  }

  const handleCloseProductSheet = () => {
    setShowProductSheet(false)
    setSelectedProduct(null)
    if (imageAutoPlay) {
      clearInterval(imageAutoPlay)
      setImageAutoPlay(null)
    }
  }

  const handleAddToCartFromSheet = async () => {
    if (!selectedProduct) return

    setIsAddingToCart(true)
    try {
      await addToCart(selectedProduct.id, quantity)
      handleCloseProductSheet()
      if (webApp) {
        webApp.showAlert("Mahsulot savatga qo'shildi!")
      } else {
        alert("Mahsulot savatga qo'shildi!")
      }
    } catch (error) {
      console.error("Savatga qo'shishda xatolik:", error)
      if (webApp) {
        webApp.showAlert("Xatolik yuz berdi")
      } else {
        alert("Xatolik yuz berdi")
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <Star className="w-4 h-4 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>,
        )
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />)
      }
    }
    return stars
  }

  if (loading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      {/* Top Bar */}
      <TopBar />

      {/* Category Bar */}
      <CategoryBar />

      {/* Ad Banner */}
      <AdBanner />

      <div className="container mx-auto px-4">
        {/* Welcome Message for Users */}
        {user && (
          <div className="py-6">
            <div className="bg-muted rounded-lg p-6 border border-border">
              <h2 className="text-xl font-bold mb-2 text-foreground">
                Salom, {user.first_name} {user.last_name}! 👋
              </h2>
              <p className="text-muted-foreground">JamolStroy ilovasiga xush kelibsiz</p>
            </div>
          </div>
        )}

        {/* Popular Products */}
        {popularProducts.length > 0 && (
          <section className="py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Mashhur mahsulotlar</h2>
              <button
                onClick={() => router.push("/catalog?popular=true")}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Barchasini ko'rish
              </button>
            </div>
            <div className="product-grid">
              {popularProducts.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section className="py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Barcha mahsulotlar</h2>
            <p className="text-muted-foreground">Qurilish materiallari va jihozlari</p>
          </div>

          <div className="product-grid">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMoreProducts}
                disabled={loadingMore}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 shadow-clean ios-button font-medium"
              >
                {loadingMore ? "Yuklanmoqda..." : "Yana yuklash"}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Cart Bar */}
      <CartBar />

      {/* Product Detail Bottom Sheet */}
      <BottomSheet isOpen={showProductSheet} onClose={handleCloseProductSheet} title="" height="full">
        {selectedProduct && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <h2 className="text-xl font-bold text-foreground">Mahsulot haqida</h2>
              <button
                onClick={handleCloseProductSheet}
                className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="md:flex md:space-x-8 p-6">
                {/* Left Side - Images (Desktop) */}
                <div className="md:w-1/2">
                  {/* Main Image */}
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4 relative">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <>
                        <Image
                          src={selectedProduct.images[selectedImageIndex] || "/placeholder.svg"}
                          alt={selectedProduct.name_uz}
                          fill
                          className="object-cover"
                        />
                        {selectedProduct.images.length > 1 && (
                          <>
                            <button
                              onClick={() =>
                                setSelectedImageIndex((prev) =>
                                  prev === 0 ? selectedProduct.images.length - 1 : prev - 1,
                                )
                              }
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-background transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5 text-foreground" />
                            </button>
                            <button
                              onClick={() =>
                                setSelectedImageIndex((prev) => (prev + 1) % selectedProduct.images.length)
                              }
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-background transition-colors"
                            >
                              <ChevronRight className="w-5 h-5 text-foreground" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <div className="w-16 h-16 bg-border rounded-lg" />
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Images */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {selectedProduct.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                            selectedImageIndex === index ? "border-primary" : "border-transparent"
                          }`}
                        >
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`${selectedProduct.name_uz} ${index + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side - Product Info */}
                <div className="md:w-1/2 mt-6 md:mt-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{selectedProduct.name_uz}</h3>
                      <p className="text-muted-foreground mb-3">{selectedProduct.category.name_uz}</p>

                      {/* Rating */}
                      {selectedProduct.rating && selectedProduct.review_count && (
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="flex items-center space-x-1">{renderStars(selectedProduct.rating)}</div>
                          <span className="font-medium text-foreground">{selectedProduct.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({selectedProduct.review_count} sharh)</span>
                        </div>
                      )}
                    </div>
                    {selectedProduct.is_featured && (
                      <span className="px-3 py-1 bg-primary text-primary-foreground font-semibold rounded ml-4">
                        TOP
                      </span>
                    )}
                  </div>

                  {selectedProduct.description_uz && (
                    <p className="text-muted-foreground mb-6 leading-relaxed">{selectedProduct.description_uz}</p>
                  )}

                  <div className="flex items-baseline space-x-2 mb-6">
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(selectedProduct.price)} so'm
                    </span>
                    <span className="text-muted-foreground">/{selectedProduct.unit}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-sm text-muted-foreground mb-1">Omborda</div>
                      <div className="font-semibold text-foreground">
                        {selectedProduct.stock_quantity} {selectedProduct.unit}
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-sm text-muted-foreground mb-1">Minimal</div>
                      <div className="font-semibold text-foreground">
                        {selectedProduct.min_order_quantity || 1} {selectedProduct.unit}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-muted rounded-lg p-4 mb-6 border border-border">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center">
                      <Truck className="w-4 h-4 mr-2" />
                      Yetkazib berish
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedProduct.delivery_limit > 0
                        ? `${formatPrice(selectedProduct.delivery_limit)} so'mdan yuqori buyurtmalarda tekin`
                        : "Yetkazib berish: " + formatPrice(selectedProduct.delivery_price) + " so'm"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Taxminiy yetkazib berish: 1-3 ish kuni</p>
                  </div>

                  {/* Quantity Selector */}
                  <div className="bg-card rounded-lg border border-border p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-foreground">Miqdor:</span>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setQuantity(Math.max(selectedProduct.min_order_quantity || 1, quantity - 1))}
                          disabled={quantity <= (selectedProduct.min_order_quantity || 1)}
                          className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className="text-lg font-semibold text-foreground min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(selectedProduct.stock_quantity, quantity + 1))}
                          disabled={quantity >= selectedProduct.stock_quantity}
                          className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="font-medium text-foreground">Jami:</span>
                      <span className="text-xl font-bold text-foreground">
                        {formatPrice(selectedProduct.price * quantity)} so'm
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCartFromSheet}
                    disabled={isAddingToCart}
                    className="w-full bg-primary text-primary-foreground rounded-lg py-4 flex items-center justify-center space-x-3 hover:bg-primary/90 transition-all font-semibold disabled:opacity-50 shadow-clean ios-button mb-6"
                  >
                    {isAddingToCart ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <ShoppingCart className="w-5 h-5" />
                    )}
                    <span>{isAddingToCart ? "Qo'shilmoqda..." : "Savatga qo'shish"}</span>
                  </button>
                </div>
              </div>

              {/* Reviews Section */}
              {productReviews.length > 0 && (
                <div className="px-6 pb-6">
                  <h4 className="text-xl font-bold text-foreground mb-4">Mijozlar sharhlari</h4>
                  <div className="space-y-4">
                    {productReviews.map((review) => (
                      <div key={review.id} className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-foreground">{review.reviewer_name}</span>
                              <div className="flex items-center space-x-1">{renderStars(review.rating)}</div>
                            </div>
                            <span className="text-sm text-muted-foreground">{formatDate(review.created_at)}</span>
                          </div>
                        </div>
                        <p className="text-foreground leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
