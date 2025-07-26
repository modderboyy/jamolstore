"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ReviewForm } from "@/components/ui/review-form"
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Eye, Truck, Package, Users } from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name_uz: string
  description_uz: string
  price: number
  images: string[]
  category: { name_uz: string }
  unit: string
  stock_quantity: number
  has_delivery: boolean
  delivery_price: number
  is_featured: boolean
  is_popular: boolean
  view_count: number
  product_type: string
  rental_price_per_unit?: number
  rental_time_unit?: string
  variations?: any[]
}

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string
  is_verified: boolean
  created_at: string
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariations, setSelectedVariations] = useState<any>({})
  const [rentalDuration, setRentalDuration] = useState(1)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    fetchProduct()
    fetchReviews()
    incrementViewCount()
  }, [params.id])

  const incrementViewCount = async () => {
    try {
      await fetch(`/api/products/${params.id}/view`, {
        method: "POST",
      })
    } catch (error) {
      console.error("View increment error:", error)
    }
  }

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name_uz),
          variations:product_variations(*)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error("Product fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          customer:users(first_name, last_name)
        `)
        .eq("product_id", params.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedReviews = data.map((review) => ({
        ...review,
        customer_name: `${review.customer.first_name} ${review.customer.last_name}`,
      }))

      setReviews(formattedReviews)
    } catch (error) {
      console.error("Reviews fetch error:", error)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    const cartItem = {
      product_id: product.id,
      product,
      quantity,
      variations: Object.keys(selectedVariations).length > 0 ? selectedVariations : null,
      rental_duration: product.product_type === "rental" ? rentalDuration : null,
      rental_time_unit: product.product_type === "rental" ? product.rental_time_unit : null,
    }

    addToCart(cartItem)
    alert("Mahsulot savatga qo'shildi!")
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

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
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Mahsulot topilmadi</h1>
          <button
            onClick={() => router.back()}
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

      <div className="container mx-auto px-4 py-4 border-b border-border">
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

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Product Images */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="aspect-square bg-muted">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[selectedImageIndex] || "/placeholder.svg"}
                alt={product.name_uz}
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="p-4 flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? "border-primary" : "border-border"
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
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{product.name_uz}</h1>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{product.category.name_uz}</span>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{product.view_count || 0}</span>
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center space-x-1">{renderStars(Math.round(averageRating))}</div>
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({reviews.length} ta sharh)
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-primary">{formatPrice(product.price)} so'm</span>
              <span className="text-sm text-muted-foreground">/{product.unit}</span>
            </div>

            {product.product_type === "rental" && product.rental_price_per_unit && (
              <div className="text-sm text-muted-foreground">
                Ijara narxi: {formatPrice(product.rental_price_per_unit)} so'm/{product.rental_time_unit}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span>Omborda: {product.stock_quantity} ta</span>
            </div>

            {product.has_delivery && (
              <div className="flex items-center space-x-1 text-green-600">
                <Truck className="w-4 h-4" />
                <span>Yetkazib berish: {formatPrice(product.delivery_price)} so'm</span>
              </div>
            )}
          </div>

          {product.description_uz && (
            <div>
              <h3 className="font-semibold mb-2">Tavsif</h3>
              <p className="text-muted-foreground">{product.description_uz}</p>
            </div>
          )}
        </div>

        {/* Variations */}
        {product.variations && product.variations.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-4">Variantlar</h3>
            <div className="space-y-4">
              {product.variations.map((variation) => (
                <div key={variation.id}>
                  <label className="block text-sm font-medium mb-2">{variation.name}</label>
                  <select
                    value={selectedVariations[variation.name] || ""}
                    onChange={(e) =>
                      setSelectedVariations((prev) => ({
                        ...prev,
                        [variation.name]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                  >
                    <option value="">Tanlang...</option>
                    {variation.options.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quantity and Rental Duration */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Miqdor</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  -
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {product.product_type === "rental" && (
              <div>
                <label className="block text-sm font-medium mb-2">Ijara muddati ({product.rental_time_unit})</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setRentalDuration(Math.max(1, rentalDuration - 1))}
                    className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-12 text-center">{rentalDuration}</span>
                  <button
                    onClick={() => setRentalDuration(rentalDuration + 1)}
                    className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0}
          className="w-full bg-primary text-primary-foreground rounded-lg py-4 font-medium hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.01] flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{product.stock_quantity === 0 ? "Omborda yo'q" : "Savatga qo'shish"}</span>
        </button>

        {/* Reviews Section */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sharhlar ({reviews.length})</h3>
            {user && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                Sharh qoldirish
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-6">
              <ReviewForm
                productId={product.id}
                onSuccess={() => {
                  setShowReviewForm(false)
                  fetchReviews()
                }}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Hali sharhlar yo'q</p>
              {user && <p className="text-sm text-muted-foreground mt-2">Birinchi bo'lib sharh qoldiring!</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{review.customer_name}</span>
                        {review.is_verified && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full">
                            Tasdiqlangan
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">{renderStars(review.rating)}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
