"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ProductCard } from "@/components/ui/product-card"
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Truck, Shield, MessageCircle, User } from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name_uz: string
  name_ru: string
  description_uz: string
  description_ru: string
  price: number
  unit: string
  images: string[]
  stock_quantity: number
  min_order_quantity: number
  delivery_limit: number
  delivery_price: number
  is_available: boolean
  is_featured: boolean
  is_popular: boolean
  view_count: number
  category: {
    name_uz: string
  }
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  reviewer: {
    first_name: string
    last_name: string
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addToCart, totalItems } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showCartFab, setShowCartFab] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    setShowCartFab(totalItems > 0)
  }, [totalItems])

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name_uz)
        `)
        .eq("id", productId)
        .eq("is_available", true)
        .single()

      if (error) throw error

      setProduct(data)
      setQuantity(data.min_order_quantity || 1)

      // Fetch similar products
      fetchSimilarProducts(data.category_id, productId)

      // Fetch reviews (mock data for now)
      setReviews([
        {
          id: "1",
          rating: 5,
          comment: "Juda sifatli mahsulot, tavsiya qilaman!",
          created_at: "2024-01-15",
          reviewer: { first_name: "Aziz", last_name: "Karimov" },
        },
        {
          id: "2",
          rating: 4,
          comment: "Yaxshi mahsulot, tez yetkazib berishdi.",
          created_at: "2024-01-10",
          reviewer: { first_name: "Malika", last_name: "Tosheva" },
        },
      ])

      // Update view count
      await supabase
        .from("products")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", productId)
    } catch (error) {
      console.error("Mahsulotni yuklashda xatolik:", error)
      router.push("/catalog")
    } finally {
      setLoading(false)
    }
  }

  const fetchSimilarProducts = async (categoryId: string, currentProductId: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name_uz)
        `)
        .eq("category_id", categoryId)
        .eq("is_available", true)
        .neq("id", currentProductId)
        .limit(6)

      if (error) throw error

      const productsWithRatings = (data || []).map((product) => ({
        ...product,
        rating: 4.0 + Math.random() * 1.0,
        review_count: Math.floor(Math.random() * 100) + 1,
      }))

      setSimilarProducts(productsWithRatings)
    } catch (error) {
      console.error("O'xshash mahsulotlarni yuklashda xatolik:", error)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!product) return

    setIsAddingToCart(true)
    try {
      await addToCart(product.id, quantity)
      // Success feedback
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Mahsulot savatga qo'shildi!")
      }
    } catch (error) {
      console.error("Savatga qo'shishda xatolik:", error)
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Xatolik yuz berdi")
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="text-center py-20">
          <h2 className="text-xl font-bold mb-2">Mahsulot topilmadi</h2>
          <p className="text-muted-foreground mb-4">Bu mahsulot mavjud emas yoki o'chirilgan</p>
          <button
            onClick={() => router.push("/catalog")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Katalogga qaytish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold line-clamp-1">{product.name_uz}</h1>
            <p className="text-sm text-muted-foreground">{product.category.name_uz}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Product Images */}
        <div className="mb-6">
          {/* Main Image */}
          <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-4 max-w-md mx-auto md:max-w-lg">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[selectedImageIndex] || "/placeholder.svg"}
                alt={product.name_uz}
                width={500}
                height={500}
                className="w-full h-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg" />
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2 justify-center">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImageIndex === index ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name_uz} ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title and Price */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold flex-1">{product.name_uz}</h1>
              {product.is_featured && (
                <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded ml-2">
                  TOP
                </span>
              )}
            </div>

            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-bold">{formatPrice(product.price)} so'm</span>
              <span className="text-muted-foreground">/{product.unit}</span>
            </div>

            {product.description_uz && (
              <p className="text-muted-foreground leading-relaxed">{product.description_uz}</p>
            )}
          </div>

          {/* Stock and Minimum Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <h4 className="text-sm text-muted-foreground mb-1">Omborda</h4>
              <p className="font-semibold">
                {product.stock_quantity} {product.unit}
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <h4 className="text-sm text-muted-foreground mb-1">Minimal buyurtma</h4>
              <p className="font-semibold">
                {product.min_order_quantity} {product.unit}
              </p>
            </div>
          </div>

          {/* Quantity Selector - Desktop */}
          <div className="hidden md:block bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Miqdorni tanlang</h3>
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => setQuantity(Math.max(product.min_order_quantity, quantity - 1))}
                disabled={quantity <= product.min_order_quantity}
                className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-semibold min-w-[4rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                disabled={quantity >= product.stock_quantity}
                className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-lg">Jami narx:</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(product.price * quantity)} so'm</span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || quantity > product.stock_quantity}
              className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 shadow-sm"
            >
              {isAddingToCart ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              <span>{isAddingToCart ? "Qo'shilmoqda..." : "Savatga qo'shish"}</span>
            </button>
          </div>

          {/* Delivery Info */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Yetkazib berish
            </h4>
            <div className="space-y-2">
              {product.delivery_limit > 0 ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-green-600">
                    {formatPrice(product.delivery_limit)} so'mdan yuqori buyurtmalarda tekin
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Yetkazib berish: <span className="font-medium">{formatPrice(product.delivery_price)} so'm</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground">Taxminiy yetkazib berish vaqti: 1-3 ish kuni</p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Sifat kafolati</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Yuqori sifat</span>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Sharhlar ({reviews.length})
            </h3>

            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">
                          {review.reviewer.first_name} {review.reviewer.last_name}
                        </span>
                        <div className="flex items-center">{renderStars(review.rating)}</div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                      <span className="text-xs text-muted-foreground">{review.created_at}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">O'xshash mahsulotlar</h3>
              <div className="product-grid">
                {similarProducts.map((similarProduct) => (
                  <ProductCard
                    key={similarProduct.id}
                    product={similarProduct}
                    onQuickView={(id) => router.push(`/product/${id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Bar - Mobile Only - Above Bottom Navigation */}
      <div className="fixed bottom-20 left-0 right-0 bg-background border-t border-border p-4 md:hidden z-30">
        <div className="flex items-center space-x-4">
          {/* Quantity Selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(product.min_order_quantity, quantity - 1))}
              disabled={quantity <= product.min_order_quantity}
              className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-semibold min-w-[3rem] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
              disabled={quantity >= product.stock_quantity}
              className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Price and Add to Cart */}
          <div className="flex-1 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold">{formatPrice(product.price * quantity)} so'm</span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || quantity > product.stock_quantity}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-sm"
            >
              {isAddingToCart ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              <span>{isAddingToCart ? "Qo'shilmoqda..." : "Savatga qo'shish"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cart FAB */}
      {showCartFab && (
        <button
          onClick={() => router.push("/cart")}
          className="fixed bottom-32 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40 md:bottom-4"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
        </button>
      )}

      <BottomNavigation />
    </div>
  )
}
