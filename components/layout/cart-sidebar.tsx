"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/CartContext"
import { X, Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import Image from "next/image"

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const router = useRouter()
  const { items, totalItems, totalPrice, deliveryFee, grandTotal, updateQuantity, removeFromCart } = useCart()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

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
    onClose()
    router.push("/checkout")
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-background shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Savatcha</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Savatcha bo'sh</h3>
              <p className="text-muted-foreground text-sm">Mahsulotlarni qo'shish uchun katalogga o'ting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-card rounded-lg border border-border p-3">
                  <div className="flex space-x-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0] || "/placeholder.svg"}
                          alt={item.product.name_uz}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">{item.product.name_uz}</h4>
                      <div className="text-sm font-bold mb-2">
                        {formatPrice(item.product.price)} so'm
                        <span className="text-xs text-muted-foreground ml-1">/{item.product.unit}</span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                            disabled={isUpdating === item.product_id || item.quantity <= 1}
                            className="w-6 h-6 bg-muted rounded flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-semibold min-w-[1.5rem] text-center">
                            {isUpdating === item.product_id ? "..." : item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                            disabled={isUpdating === item.product_id}
                            className="w-6 h-6 bg-muted rounded flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.product_id)}
                          disabled={isUpdating === item.product_id}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Jami:</span>
                    <span className="text-sm font-bold">{formatPrice(item.product.price * item.quantity)} so'm</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 space-y-4">
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mahsulotlar ({totalItems} ta):</span>
                  <span>{formatPrice(totalPrice)} so'm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Yetkazib berish:</span>
                  <span>{deliveryFee === 0 ? "Tekin" : formatPrice(deliveryFee) + " so'm"}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Jami:</span>
                  <span>{formatPrice(grandTotal)} so'm</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                Buyurtma berish
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
