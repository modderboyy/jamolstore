"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ContactFab } from "@/components/ui/contact-fab"
import { ReviewForm } from "@/components/ui/review-form"
import { ArrowLeft, Heart, Share2, Star, ShoppingCart, Plus, Minus, Eye, Calendar, Loader2 } from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category_name: string
  stock_quantity: number
  is_rental: boolean
  rental_price_per_day?: number
  average_rating?: number
  total_reviews?: number
}

interface Review {
  id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && params.id) {
      fetchProduct()
      fetchReviews()
      recordView()
    }
  }, [params.id, mounted])

  const fetchProduct = async () => {
    if (!mounted) return

    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
      }
    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async () => {
    if (!mounted) return

    try {
      const response = await fetch(`/api/products/${params.id}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const recordView = async () => {
    if (!mounted) return

    try {
      await fetch(`/api/products/${params.id}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id || null,
        }),
      })
    } catch (error) {
      console.error("Error recording view:", error)
    }
  }

  const handleAddToCart = () => {
    if (!product || !mounted) return

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: quantity,
    }

    addToCart(cartItem)
    alert("Mahsulot savatga qo'shildi!")
  }

  const handleQuantityChange = (delta: number) => {
    if (!mounted) return
    setQuantity(Math.max(1, Math.min(product?.stock_quantity || 1, quantity + delta)))
  }

  const handleShare = async () => {
    if (!mounted || !product) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert("Havola nusxalandi!")
      } catch (error) {
        console.error("Error copying to clipboard:", error)
      }
    }
  }

  const handleBack = () => {
    if (!mounted) return
    router.back()
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Mahsulot topilmadi</h1>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Orqaga qaytish
          </button>
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
            <div className="flex items-center space-x-4">
              <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold truncate">{product.name}</h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-2 rounded-lg transition-colors ${
                  isWishlisted ? "text-red-500 bg-red-50" : "hover:bg-muted"
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </button>

              <button onClick={handleShare} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Product Image */}
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
          <Image
            src={product.image_url || "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {product.is_rental && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              <Calendar className="w-4 h-4 inline mr-1" />
              Ijara
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground">{product.category_name}</p>
          </div>

          {/* Rating */}
          {product.average_rating && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (product.average_rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.average_rating?.toFixed(1)} ({product.total_reviews} sharh)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">{product.price.toLocaleString()} so'm</div>
            {product.is_rental && product.rental_price_per_day && (
              <div className="text-lg text-muted-foreground">
                Kunlik: {product.rental_price_per_day.toLocaleString()} so'm
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center space-x-2 text-sm">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Omborda: {product.stock_quantity} dona</span>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Tavsif</h3>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Miqdor:</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="text-lg font-semibold min-w-[3rem] text-center">{quantity}</span>

              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock_quantity}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0}
          className="w-full py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-semibold"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{product.stock_quantity === 0 ? "Omborda yo'q" : "Savatga qo'shish"}</span>
        </button>

        {/* Reviews Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Sharhlar</h3>
            {user && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                Sharh yozish
              </button>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{review.user_name}</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-2">{review.comment}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("uz-UZ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Hozircha sharhlar yo'q. Birinchi bo'lib sharh yozing!
            </p>
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          productId={product.id}
          onClose={() => setShowReviewForm(false)}
          onSubmit={() => {
            setShowReviewForm(false)
            fetchReviews()
          }}
        />
      )}

      <ContactFab />
      <BottomNavigation />
    </div>
  )
}
