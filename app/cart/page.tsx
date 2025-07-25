"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Clock, Calendar } from "lucide-react"
import Image from "next/image"

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, totalItems, totalPrice, deliveryFee, grandTotal, updateQuantity, removeFromCart, loading } = useCart()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

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

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    setIsUpdating(itemId)
    try {
      await updateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setIsUpdating(itemId)
    try {
      await removeFromCart(itemId)
    } catch (error) {
      console.error("Error removing item:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  const calculateItemTotal = (item: any) => {
    if (item.product.product_type === "rental" && item.product.rental_price_per_unit && item.rental_duration) {
      const rentalTotal = item.product.rental_price_per_unit * item.rental_duration * item.quantity
      const depositTotal = (item.product.rental_deposit || 0) * item.quantity
      return rentalTotal + depositTotal
    }
    return item.product.price * item.quantity
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

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Savatcha</h1>
            <p className="text-sm text-muted-foreground">{totalItems} ta mahsulot</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Savatcha bo'sh</h2>
            <p className="text-muted-foreground mb-6">Hozircha hech qanday mahsulot qo'shilmagan</p>
            <button
              onClick={() => router.push("/catalog")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Xarid qilishni boshlash
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0] || "/placeholder.svg"}
                          alt={item.product.name_uz}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <div className="w-8 h-8 bg-muted-foreground/20 rounded" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{item.product.name_uz}</h3>

                      {/* Rental Info */}
                      {item.product.product_type === "rental" && item.rental_duration && (
                        <div className="flex items-center space-x-1 mb-2">
                          {getRentalIcon(item.rental_time_unit)}
                          <span className="text-sm text-blue-600">
                            {item.rental_duration} {getRentalTimeText(item.rental_time_unit)} ijara
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="mb-3">
                        {item.product.product_type === "rental" && item.product.rental_price_per_unit ? (
                          <div>
                            <p className="text-primary font-semibold">
                              {formatPrice(item.product.rental_price_per_unit)} so'm/
                              {getRentalTimeText(item.rental_time_unit)}
                            </p>
                            {item.product.rental_deposit && item.product.rental_deposit > 0 && (
                              <p className="text-xs text-muted-foreground">
                                + {formatPrice(item.product.rental_deposit)} so'm kafolat
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-primary font-semibold">
                            {formatPrice(item.product.price)} so'm/{item.product.unit}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={isUpdating === item.id || item.quantity <= (item.product.min_order_quantity || 1)}
                            className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={isUpdating === item.id || item.quantity >= item.product.stock_quantity}
                            className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-primary">{formatPrice(calculateItemTotal(item))} so'm</span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isUpdating === item.id}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Buyurtma xulosasi</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Mahsulotlar ({totalItems} ta):</span>
                  <span>{formatPrice(totalPrice)} so'm</span>
                </div>
                <div className="flex justify-between">
                  <span>Yetkazib berish:</span>
                  <span>{formatPrice(deliveryFee)} so'm</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Jami:</span>
                    <span className="text-primary">{formatPrice(grandTotal)} so'm</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="w-full mt-6 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                Buyurtma berish
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
