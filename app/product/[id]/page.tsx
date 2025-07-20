"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Truck, Shield } from "lucide-react"
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

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

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

      // View count ni oshirish
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
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
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
          <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[selectedImageIndex] || "/placeholder.svg"}
                alt={product.name_uz}
                width={400}
                height={400}
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
            <div className="flex space-x-2 overflow-x-auto pb-2">
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
              <h1 className="text-xl font-bold flex-1">{product.name_uz}</h1>
              {product.is_featured && (
                <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded ml-2">
                  TOP
                </span>
              )}
            </div>

            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-2xl font-bold">{formatPrice(product.price)} so'm</span>
              <span className="text-muted-foreground">/{product.unit}</span>
            </div>

            {product.description_uz && (
              <p className="text-muted-foreground leading-relaxed">{product.description_uz}</p>
            )}
          </div>

          {/* Stock and Minimum Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-sm text-muted-foreground mb-1">Omborda</h4>
              <p className="font-semibold">
                {product.stock_quantity} {product.unit}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-sm text-muted-foreground mb-1">Minimal buyurtma</h4>
              <p className="font-semibold">
                {product.min_order_quantity} {product.unit}
              </p>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-card rounded-lg border border-border p-4">
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

          {/* Quantity Selector */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Miqdor:</span>
              <div className="flex items-center space-x-3">
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
            </div>

            {/* Total Price */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="font-medium">Jami:</span>
              <span className="text-xl font-bold">{formatPrice(product.price * quantity)} so'm</span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || quantity > product.stock_quantity}
            className="w-full bg-primary text-primary-foreground rounded-lg py-4 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
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

      <BottomNavigation />
    </div>
  )
}
