"use client"

import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/CartContext"
import { ShoppingCart } from "lucide-react"

export function CartBar() {
  const router = useRouter()
  const { totalItems, grandTotal } = useCart()

  if (totalItems === 0) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 p-4 z-30 md:bottom-4">
      <button
        onClick={() => router.push("/cart")}
        className="w-full bg-primary text-primary-foreground rounded-lg p-4 flex items-center justify-between shadow-lg hover:bg-primary/90 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary-foreground text-primary text-xs font-bold rounded-full flex items-center justify-center">
              {totalItems}
            </div>
          </div>
          <span className="font-medium">Savatcha</span>
        </div>
        <div className="text-right">
          <div className="font-bold">{formatPrice(grandTotal)} so'm</div>
          <div className="text-sm opacity-90">Buyurtma berish</div>
        </div>
      </button>
    </div>
  )
}
