"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { TopBar } from "@/components/layout/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const { webApp } = useTelegram()
  const [isLoading, setIsLoading] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId)
    } else {
      await updateQuantity(productId, newQuantity)
    }
  }

  const handleCheckout = () => {
    if (!user) {
      router.push("/login")
      return
    }
    router.push("/checkout")
  }

  const handleClearCart = async () => {
    if (webApp) {
      webApp.showConfirm("Savatni tozalashni xohlaysizmi?", (confirmed) => {
        if (confirmed) {
          clearCart()
        }
      })
    } else {
      if (confirm("Savatni tozalashni xohlaysizmi?")) {
        clearCart()
      }
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />

        {/* Header */}
        <header className="bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Savat</h1>
                <p className="text-sm text-muted-foreground">Sizning xaridlaringiz</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Savat bo'sh</h2>
            <p className="text-muted-foreground mb-8">
              Hozircha savatda hech qanday mahsulot yo'q. Katalogdan mahsulotlarni tanlang.
            </p>
            <Button onClick={() => router.push("/catalog")} className="w-full">
              Katalogga o'tish
            </Button>
          </div>
        </div>

        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-4">
      <TopBar />

      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Savat</h1>
                <p className="text-sm text-muted-foreground">{items.length} ta mahsulot</p>
              </div>
            </div>
            {items.length > 0 && (
              <button onClick={handleClearCart} className="text-red-500 hover:text-red-600 text-sm font-medium">
                Tozalash
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <Card key={item.product.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex space-x-4">
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
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{item.product.name_uz}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formatPrice(item.product.price)} so'm/{item.product.unit}
                    </p>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Jami:</span>
                        <span className="font-semibold text-primary">
                          {formatPrice(item.product.price * item.quantity)} so'm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 pb-safe md:pb-4 z-50">
        <div className="container mx-auto max-w-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Jami summa:</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(getTotalPrice())} so'm</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{items.length} ta mahsulot</p>
              <p className="text-sm text-muted-foreground">
                {items.reduce((sum, item) => sum + item.quantity, 0)} ta dona
              </p>
            </div>
          </div>

          <Button onClick={handleCheckout} disabled={isLoading} className="w-full h-12 text-lg font-semibold shadow-lg">
            {isLoading ? "Yuklanmoqda..." : "Buyurtma berish"}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Yetkazib berish narxi keyingi bosqichda hisoblanadi
          </p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
