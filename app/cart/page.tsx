"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CartPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { items, totalItems, totalPrice, deliveryFee, grandTotal, updateQuantity, removeFromCart } = useCart()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    setIsUpdating(productId)
    try {
      await updateQuantity(productId, newQuantity)
    } catch (error) {
      console.error("Miqdorni yangilashda xatolik:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveItem = async (productId: string) => {
    setIsUpdating(productId)
    try {
      await removeFromCart(productId)
    } catch (error) {
      console.error("Mahsulotni o'chirishda xatolik:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleCheckout = () => {
    router.push("/checkout")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="container mx-auto px-4 py-8 text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-title-2 font-bold mb-2">Savatcha bo'sh</h2>
          <p className="text-body text-muted-foreground mb-6">Savatcha ko'rish uchun tizimga kiring</p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Kirish
          </Link>
        </div>
        <BottomNavigation />
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
          <div>
            <h1 className="text-title-3 font-bold">Savatcha</h1>
            <p className="text-footnote text-muted-foreground">{totalItems} ta mahsulot</p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="container mx-auto px-4 py-8 text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-title-2 font-bold mb-2">Savatcha bo'sh</h2>
          <p className="text-body text-muted-foreground mb-6">
            Mahsulotlarni ko'rish va savatga qo'shish uchun katalogga o'ting
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Katalogga o'tish
          </Link>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6">
          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0] || "/placeholder.svg"}
                        alt={item.product.name_uz}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-muted-foreground/20 rounded" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-headline font-semibold mb-1 line-clamp-2">{item.product.name_uz}</h3>
                    <div className="text-title-3 font-bold mb-3">
                      {formatPrice(item.product.price)} so'm
                      <span className="text-footnote text-muted-foreground ml-1">/{item.product.unit}</span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          disabled={isUpdating === item.product_id || item.quantity <= 1}
                          className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-semibold min-w-[2rem] text-center">
                          {isUpdating === item.product_id ? "..." : item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                          disabled={isUpdating === item.product_id}
                          className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        disabled={isUpdating === item.product_id}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Item Total */}
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-body text-muted-foreground">Jami:</span>
                  <span className="text-title-3 font-bold">{formatPrice(item.product.price * item.quantity)} so'm</span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-lg border border-border p-6 mb-6">
            <h3 className="text-title-3 font-bold mb-4">Buyurtma xulosasi</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-body">Mahsulotlar ({totalItems} ta):</span>
                <span className="text-body font-medium">{formatPrice(totalPrice)} so'm</span>
              </div>

              <div className="flex justify-between">
                <span className="text-body">Yetkazib berish:</span>
                <span className="text-body font-medium">
                  {deliveryFee === 0 ? "Tekin" : formatPrice(deliveryFee) + " so'm"}
                </span>
              </div>

              {deliveryFee === 0 && totalPrice < 100000 && (
                <p className="text-footnote text-muted-foreground">
                  100,000 so'mdan yuqori buyurtmalarda yetkazib berish tekin
                </p>
              )}

              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-title-3 font-bold">Jami to'lov:</span>
                  <span className="text-title-2 font-bold">{formatPrice(grandTotal)} so'm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            className="w-full bg-primary text-primary-foreground rounded-lg py-4 font-medium hover:bg-primary/90 transition-colors"
          >
            Buyurtma berish
          </button>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}
