"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from "lucide-react"
import Image from "next/image"

export default function CartPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { items, updateQuantity, removeFromCart, totalItems, grandTotal, clearCart } = useCart()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
    } else {
      updateQuantity(itemId, newQuantity)
    }
  }

  const handleCheckout = () => {
    if (items.length === 0) return
    setIsLoading(true)
    router.push("/checkout")
  }

  const deliveryFee = grandTotal >= 200000 ? 0 : 15000
  const finalTotal = grandTotal + deliveryFee

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6" />
            <span>Savat</span>
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalItems}
              </Badge>
            )}
          </h1>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Savatni tozalashni xohlaysizmi?")) {
                  clearCart()
                }
              }}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Tozalash
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Savat bo'sh</h3>
              <p className="text-muted-foreground text-center mb-6">
                Mahsulotlarni ko'rish va savatga qo'shish uchun katalogga o'ting
              </p>
              <Button onClick={() => router.push("/catalog")} className="flex items-center space-x-2">
                <span>Katalogga o'tish</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{formatPrice(item.price)} so'm</p>
                        {item.variation && (
                          <p className="text-xs text-muted-foreground mb-2">Variant: {item.variation}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)} so'm</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Delivery Info */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-700 dark:text-green-300">Yetkazib berish</h3>
                    {grandTotal >= 200000 ? (
                      <p className="text-sm text-green-600 dark:text-green-400">🎉 Tekin yetkazib berish!</p>
                    ) : (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        200,000 so'mdan yuqorida tekin yetkazib berish
                      </p>
                    )}
                  </div>
                  {grandTotal < 200000 && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {formatPrice(200000 - grandTotal)} so'm qoldi
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Buyurtma xulosasi</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mahsulotlar ({totalItems} ta)</span>
                    <span>{formatPrice(grandTotal)} so'm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Yetkazib berish</span>
                    <span className={deliveryFee === 0 ? "text-green-600" : ""}>
                      {deliveryFee === 0 ? "Tekin" : `${formatPrice(deliveryFee)} so'm`}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Jami</span>
                    <span>{formatPrice(finalTotal)} so'm</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Button */}
            <div className="sticky bottom-20 md:bottom-4 bg-background/80 backdrop-blur-sm p-4 -mx-4 border-t">
              <Button
                onClick={handleCheckout}
                disabled={isLoading || items.length === 0}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Buyurtma berish</span>
                    <span className="ml-2">({formatPrice(finalTotal)} so'm)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
