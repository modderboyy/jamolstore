"use client"

import type React from "react"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/CartContext"

// Prop tipi o'zgarishsiz qoladi
interface CartFabProps {
  onCartClick: () => void
}

export function CartFab({ onCartClick }: CartFabProps) {
  const { uniqueItemsCount } = useCart()

  // Agar savatda mahsulot bo'lmasa, tugmani ko'rsatmaymiz
  if (uniqueItemsCount === 0) {
    return null
  }

  // Sudrab yurish (drag) uchun kerak bo'lgan barcha state, ref va effektlar olib tashlandi.
  // Endi faqat oddiy tugma (button) sifatida ishlaydi.

  // Bosish hodisasi endi to'g'ridan-to'g'ri onCartClick funksiyasini chaqiradi
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault() // Sahifani yangilanishini oldini olish
    onCartClick()      // Asosiy funksiyani chaqirish (sidebar'ni ochish)
  }

  return (
    <button
      onClick={handleClick}
      // Tugma pozitsiyasi endi inline style orqali emas, Tailwind klasslari orqali belgilanadi
      // Bu tugmani doimiy ravishda pastki o'ng burchakda ushlab turadi
      className="fixed bottom-20 right-5 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-transform hover:scale-110 z-40 md:hidden cursor-pointer"
      // onMouseDown, onTouchStart va inline style'lar olib tashlandi
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {uniqueItemsCount > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-lg">
            {uniqueItemsCount > 99 ? "99+" : uniqueItemsCount}
          </span>
        )}
      </div>
    </button>
  )
}
