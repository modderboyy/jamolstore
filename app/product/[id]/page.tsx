"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { DraggableFab } from "@/components/ui/draggable-fab"
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Eye,
  Calendar,
  Package,
  MessageSquare,
  Plus,
  Minus,
} from "lucide-react"

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

interface Review {
  id: string
  rating: number
  comment: string
  is_verified: boolean
  created_at: string
  users: {
    first_name: string
    last_name: string
    avatar_url: string
  }
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isRental, setIsRental] = useState(false)
  const [rentalDuration, setRentalDuration] = useState(1)
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
      fetchReviews()
      incrementView()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", params.id)
        .eq("is_active", true)
        .single()

      if (error) throw error
      setProduct(data)
      setIsRental(data.is_rental && data.rental_price > 0)
    } catch (error) {
      console.error("Product fetch error:", error)
      router.push("/404")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${params.id}`, {
        headers: user ? { "x-user-id": user.id } : {},
      })

      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews || [])
        setAverageRating(data.averageRating || 0)
        setTotalReviews(data.totalReviews || 0)
      }
    } catch (error) {
      console.error("Reviews fetch error:", error)
    }
  }

  const incrementView = async () => {
    try {
      await fetch(`/api/products/${params.id}/view`, {
        method: "POST",
      })
    } catch (error) {
      console.error("View increment error:", error)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    const price = isRental ? product.rental_price : product.price

    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url,
      price: price,
      quantity: quantity,
      is_rental: isRental,
      rental_duration: isRental ? rentalDuration : undefined,
    })

    alert(`${product.name} savatga qo'shildi!`)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Mahsulot topilmadi</h2>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Bosh sahifaga qaytish
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Product Image */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <img src={product.image_url || "/placeholder.jpg"} alt={product.name} className="w-full h-80 object-cover" />
        </div>

        {/* Product Info */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-3">
                {totalReviews > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center">{renderStars(Math.round(averageRating))}</div>
                    <span className="text-sm text-muted-foreground">
                      ({averageRating.toFixed(1)}) • {totalReviews} sharh
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>{product.view_count || 0} ko'rildi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {isRental ? product.rental_price?.toLocaleString() : product.price.toLocaleString()} so'm
              </span>
              {product.is_rental && product.rental_price > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsRental(false)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      !isRental ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Sotib olish
                  </button>
                  <button
                    onClick={() => setIsRental(true)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      isRental ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Ijaraga olish
                  </button>
                </div>
              )}
            </div>

            {isRental && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Ijara muddati</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setRentalDuration(Math.max(1, rentalDuration - 1))}
                    className="p-1 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium min-w-[60px] text-center">{rentalDuration} kun</span>
                  <button
                    onClick={() => setRentalDuration(rentalDuration + 1)}
                    className="p-1 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-medium min-w-[40px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Package className="w-4 h-4" />
                <span>{product.stock_quantity} ta mavjud</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-lg font-semibold mb-3">Mahsulot haqida</h2>
          <p className="text-muted-foreground leading-relaxed">
            {product.description || "Mahsulot haqida ma'lumot kiritilmagan."}
          </p>
        </div>

        {/* Reviews */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Sharhlar</h2>
              {totalReviews > 0 && <span className="text-sm text-muted-foreground">({totalReviews})</span>}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Hali sharhlar yo'q</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-b border-border pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{review.users.first_name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            {review.users.first_name} {review.users.last_name}
                          </span>
                          {review.is_verified && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full">
                              Tasdiqlangan
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 mt-1">{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground ml-11">{review.comment}</p>}
                </div>
              ))}

              {reviews.length > 3 && (
                <button className="w-full py-2 text-primary hover:text-primary/80 transition-colors text-sm">
                  Barcha sharhlarni ko'rish ({reviews.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="sticky bottom-20 md:bottom-4 bg-background/80 backdrop-blur-sm border-t border-border p-4 -mx-4">
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>
              {product.stock_quantity === 0
                ? "Mavjud emas"
                : `Savatga qo'shish - ${((isRental ? product.rental_price : product.price) * quantity).toLocaleString()} so'm`}
            </span>
          </button>
        </div>
      </div>

      <DraggableFab />
      <BottomNavigation />
    </div>
  )
}
