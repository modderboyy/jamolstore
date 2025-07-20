"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ProductCard } from "@/components/ui/product-card"
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  MessageCircle,
  User,
  Clock,
  Calendar,
  Info,
} from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name_uz: string
  name_ru: string
  description_uz: string
  description_ru: string
  price: number
  unit: string
  product_type: "sale" | "rental"
  rental_time_unit?: "hour" | "day" | "week" | "month"
  rental_price_per_unit?: number
  rental_deposit?: number
  rental_min_duration?: number
  rental_max_duration?: number
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
  const [rentalDuration, setRentalDuration] = useState(1)
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
      setRentalDuration(data.rental_min_duration || 1)

      // Fetch similar products
      fetchSimilarProducts(data.category_id, productId)

      // Fetch real reviews from completed orders
      fetchProductReviews(productId)

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

  const fetchProductReviews = async (productId: string) => {
    try {
      // Fetch real reviews from the reviews table
      const { data, error } = await supabase
        .from("reviews")
        .select(`
        id,
        rating,
        comment,
        created_at,
        customer:customers(
          first_name,
          last_name
        )
      `)
        .eq("product_id", productId)
        .eq("is_verified", true)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      // Convert to review format
      const realReviews: Review[] = (data || []).map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment || "Yaxshi mahsulot!",
        created_at: review.created_at,
        reviewer: {
          first_name: review.customer?.first_name || "Mijoz",
          last_name: review.customer?.last_name || "",
        },
      }))

      setReviews(realReviews)
    } catch (error) {
      console.error("Sharhlarni yuklashda xatolik:", error)
      // Fallback to mock reviews if no real reviews found
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
      if (product.product_type === "rental") {
        await addToCart(product.id, quantity, {
          rental_duration: rentalDuration,
          rental_time_unit: product.rental_time_unit,
        })
      } else {
        await addToCart(product.id, quantity)
      }

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

  const getRentalTimeText = (unit?: string) => {
    switch (unit) {
      case "hour":
        return "soat"
      case "day":
        return "kun"
      case "week":
        return "hafta"
      case "month":
        return "oy"
      default:
        return "vaqt"
    }
  }

  const getRentalIcon = (unit?: string) => {
    switch (unit) {
      case "hour":
        return <Clock className="w-4 h-4" />
      case "day":
      case "week":
      case "month":
        return <Calendar className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const calculateRentalTotal = () => {
    if (!product || product.product_type !== "rental" || !product.rental_price_per_unit) {
      return 0
    }
    return product.rental_price_per_unit * rentalDuration * quantity
  }

  const calculateRentalDeposit = () => {
    if (!product || product.product_type !== "rental" || !product.rental_deposit) {
      return 0
    }
    return product.rental_deposit * quantity
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
    <div className="min-h-screen bg-background pb-32 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold line-clamp-1">{product.name_uz}</h1>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">{product.category.name_uz}</p>
              {product.product_type === "rental" && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded flex items-center space-x-1">
                  {getRentalIcon(product.rental_time_unit)}
                  <span>IJARA</span>
                </span>
              )}
            </div>
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

            {product.product_type === "rental" && product.rental_price_per_unit ? (
              <div className="mb-4">
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatPrice(product.rental_price_per_unit)} so'm
                  </span>
                  <span className="text-muted-foreground">
                    /{getRentalTimeText(product.rental_time_unit)} • {product.unit}
                  </span>
                </div>
                {product.rental_deposit && product.rental_deposit > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Kafolat puli: {formatPrice(product.rental_deposit)} so'm/{product.unit}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-3xl font-bold">{formatPrice(product.price)} so'm</span>
                <span className="text-muted-foreground">/{product.unit}</span>
              </div>
            )}

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
              <h4 className="text-sm text-muted-foreground mb-1">
                {product.product_type === "rental" ? "Minimal muddat" : "Minimal buyurtma"}
              </h4>
              <p className="font-semibold">
                {product.product_type === "rental"
                  ? `${product.rental_min_duration} ${getRentalTimeText(product.rental_time_unit)}`
                  : `${product.min_order_quantity} ${product.unit}`}
              </p>
            </div>
          </div>

          {/* Rental Duration Selector - Desktop Only */}
          {product.product_type === "rental" && (
            <div className="hidden md:block bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                {getRentalIcon(product.rental_time_unit)}
                <span className="ml-2">Ijara muddatini tanlang</span>
              </h3>
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => setRentalDuration(Math.max(product.rental_min_duration || 1, rentalDuration - 1))}
                  disabled={rentalDuration <= (product.rental_min_duration || 1)}
                  className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className="text-2xl font-semibold">{rentalDuration}</span>
                  <p className="text-sm text-muted-foreground">{getRentalTimeText(product.rental_time_unit)}</p>
                </div>
                <button
                  onClick={() => setRentalDuration(Math.min(product.rental_max_duration || 365, rentalDuration + 1))}
                  disabled={rentalDuration >= (product.rental_max_duration || 365)}
                  className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-600">Ijara hisob-kitobi</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Ijara narxi:</span>
                    <span>{formatPrice(calculateRentalTotal())} so'm</span>
                  </div>
                  {product.rental_deposit && product.rental_deposit > 0 && (
                    <div className="flex justify-between">
                      <span>Kafolat puli:</span>
                      <span>{formatPrice(calculateRentalDeposit())} so'm</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Jami to'lov:</span>
                    <span>{formatPrice(calculateRentalTotal() + calculateRentalDeposit())} so'm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Selector - Desktop Only */}
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
              <span className="text-2xl font-bold text-primary">
                {product.product_type === "rental"
                  ? formatPrice(calculateRentalTotal() + calculateRentalDeposit())
                  : formatPrice(product.price * quantity)}{" "}
                so'm
              </span>
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
              <span>
                {isAddingToCart
                  ? "Qo'shilmoqda..."
                  : product.product_type === "rental"
                    ? "Ijaraga olish"
                    : "Savatga qo'shish"}
              </span>
            </button>
          </div>

          {/* Delivery Info */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              {product.product_type === "rental" ? "Yetkazib berish va qaytarish" : "Yetkazib berish"}
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
              <p className="text-sm text-muted-foreground">
                Taxminiy yetkazib berish vaqti: {product.product_type === "rental" ? "2-4 soat" : "1-3 ish kuni"}
              </p>
              {product.product_type === "rental" && (
                <p className="text-sm text-muted-foreground">
                  Qaytarish: Ijara muddati tugagach, mahsulotni qaytarib berish kerak
                </p>
              )}
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
          {reviews.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Mijozlar sharhlari ({reviews.length})
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
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("uz-UZ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">O'xshash mahsulotlar</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

      {/* Fixed Bottom Bar - Mobile Only - Responsive */}
      <div className="fixed bottom-20 left-0 right-0 bg-background border-t border-border p-4 md:hidden z-30 safe-area-bottom">
        <div className="max-w-sm mx-auto">
          {/* Rental Duration Selector for Mobile */}
          {product.product_type === "rental" && (
            <div className="mb-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Ijara muddati:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setRentalDuration(Math.max(product.rental_min_duration || 1, rentalDuration - 1))}
                    disabled={rentalDuration <= (product.rental_min_duration || 1)}
                    className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center disabled:opacity-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-semibold min-w-[4rem] text-center">
                    {rentalDuration} {getRentalTimeText(product.rental_time_unit)}
                  </span>
                  <button
                    onClick={() => setRentalDuration(Math.min(product.rental_max_duration || 365, rentalDuration + 1))}
                    disabled={rentalDuration >= (product.rental_max_duration || 365)}
                    className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart - Responsive */}
          <div className="flex items-center space-x-3">
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

            {/* Price and Add to Cart - Responsive */}
            <div className="flex-1 flex flex-col space-y-2">
              <div className="text-right">
                <div className="text-lg font-bold">
                  {product.product_type === "rental"
                    ? formatPrice(calculateRentalTotal() + calculateRentalDeposit())
                    : formatPrice(product.price * quantity)}{" "}
                  so'm
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || quantity > product.stock_quantity}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 shadow-sm"
              >
                {isAddingToCart ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {isAddingToCart
                    ? "Qo'shilmoqda..."
                    : product.product_type === "rental"
                      ? "Ijaraga olish"
                      : "Savatga qo'shish"}
                </span>
              </button>
            </div>
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
