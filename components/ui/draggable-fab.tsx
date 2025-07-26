"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/CartContext"

interface DraggableFabProps {
  onCartClick: () => void
}

export function DraggableFab({ onCartClick }: DraggableFabProps) {
  const { uniqueItemsCount } = useCart()
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  // hasMoved state endi kerak emas, lekin o'chirmaslikni so'raganingiz uchun qoldirildi
  const [hasMoved, setHasMoved] = useState(false)
  const fabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Boshlang'ich pozitsiyani o'rnatish (pastki o'ng taraf)
    const updatePosition = () => {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      setPosition({
        x: windowWidth - 80, // o'ngdan 80px
        y: windowHeight - 160, // pastdan 160px
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    return () => window.removeEventListener("resize", updatePosition)
  }, [])

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setHasMoved(false)
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    })
  }

  const handleMove = (clientX: number, clientY: number) => {
    // Qimirlash funksiyasi o'chirilgan, shuning uchun bu funksiya hech narsa qilmaydi
    if (!isDragging) return
    
    // Harakatlanishni o'chirish uchun quyidagi qatorlar o'chirildi yoki izohga olindi.
    // const newX = clientX - dragStart.x
    // const newY = clientY - dragStart.y
    //
    // if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
    //   setHasMoved(true)
    // }
    //
    // const maxX = window.innerWidth - 56
    // const maxY = window.innerHeight - 56
    //
    // setPosition({
    //   x: Math.max(0, Math.min(newX, maxX)),
    //   y: Math.max(0, Math.min(newY, maxY)),
    // })
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleStart(e.clientX, e.clientY)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      // e.preventDefault() // Bu kerak bo'lmasligi mumkin, chunki harakat o'chirilgan
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleEnd)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleEnd)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleEnd)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleEnd)
      }
    }
  }, [isDragging, dragStart]) // Bu yerdagi bog'liqliklar saqlanib qoldi

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TUZATISH: "hasMoved" (harakatlandi) holatini tekshirish olib tashlandi.
    // Endi tugma bosilganda har doim "onCartClick" funksiyasi ishlaydi.
    if (onCartClick) {
      onCartClick()
    }
  }

  if (uniqueItemsCount === 0) return null

  return (
    <button
      ref={fabRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`fixed w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40 md:hidden ${
        isDragging ? "cursor-grabbing" : "cursor-pointer hover:scale-110"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        // "isDragging" holatidagi o'zgarishlar olib tashlandi, chunki harakat o'chirildi
        transform: "scale(1)", 
        transition: "transform 0.2s ease",
        touchAction: "none", // Sahifani aylantirishni oldini olish uchun
      }}
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
