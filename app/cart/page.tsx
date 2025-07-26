"use client"

import { useCart } from "@/contexts/CartContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Trash2, ShoppingBag, Truck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, subtotal, deliveryFee, grandTotal } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const freeDeliveryThreshold = 200000
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="container mx-auto px-4 py-8 pb-20">
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Savat bo'sh</h2>
              <p className="text-muted-foreground mb-6">Hozircha savatda hech qanday mahsulot yo'q</p>
              <Link href="/catalog">
                <Button>Xarid qilishni boshlash</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Savat ({totalItems})</h1>
          <Button variant="outline" onClick={clearCart}>
            <Trash2 className="w-4 h-4 mr-2" />
            Tozalash
          </Button>
        </div>

        {/* Free delivery banner */}
        {remainingForFreeDelivery > 0 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Tekin yetkazib berish uchun yana {formatPrice(remainingForFreeDelivery)} so'm qo'shing!
                  </p>
                  <p className="text-xs text-blue-700">200,000 so'mdan yuqorida buyurtmalarda yetkazib berish tekin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <Card key={`${item.id}-${item.variation_id || "default"}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>

                    {item.variation_name && (
                      <Badge variant="secondary" className="text-xs mb-2">
                        {item.variation_name}
                      </Badge>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.variation_id, Math.max(0, item.quantity - 1))}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>

                        <span className="font-medium min-w-[2rem] text-center">{item.quantity}</span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.variation_id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)} so'm</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(item.price)} so'm/dona</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id, item.variation_id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Buyurtma xulosasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Mahsulotlar ({totalItems} ta)</span>
              <span>{formatPrice(subtotal)} so'm</span>
            </div>

            <div className="flex justify-between">
              <span>Yetkazib berish</span>
              <span className={deliveryFee === 0 ? "text-green-600 font-medium" : ""}>
                {deliveryFee === 0 ? "Tekin" : `${formatPrice(deliveryFee)} so'm`}
              </span>
            </div>

            {deliveryFee === 0 && subtotal >= freeDeliveryThreshold && (
              <p className="text-xs text-green-600">✓ 200,000 so'mdan yuqorida tekin yetkazib berish</p>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Jami</span>
              <span>{formatPrice(grandTotal)} so'm</span>
            </div>

            <Link href="/checkout" className="block">
              <Button className="w-full" size="lg">
                Buyurtma berish
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}
