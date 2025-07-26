"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/CartContext"

interface DraggableFabProps {
  onCartClick: () => void
}

export function DraggableFab({ onCartClick }: DraggableFabProps) {
  const { getTotalItems } = useCart()
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(true)
  const fabRef = useRef<HTMLButtonElement>(null)
  const totalItems = getTotalItems()

  // Auto-hide when scrolling
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      setIsVisible(false)
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        setIsVisible(true)
      }, 150)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = Math.max(0, Math.min(window.innerWidth - 56, e.clientX - dragStart.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 56, e.clientY - dragStart.y))

    setPosition({ x: newX, y: newY })
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return

    const touch = e.touches[0]
    const newX = Math.max(0, Math.min(window.innerWidth - 56, touch.clientX - dragStart.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 56, touch.clientY - dragStart.y))

    setPosition({ x: newX, y: newY })
  }

  const handleEnd = () => {
    if (isDragging) {
      setIsDragging(false)

      // Snap to edges
      const centerX = position.x + 28
      const snapToLeft = centerX < window.innerWidth / 2

      setPosition((prev) => ({
        x: snapToLeft ? 20 : window.innerWidth - 76,
        y: Math.max(20, Math.min(window.innerHeight - 76, prev.y)),
      }))
    }
  }

  useEffect(() => {
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
  }, [isDragging, dragStart])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isDragging) {
      onCartClick()
    }
  }

  if (totalItems === 0) return null

  return (
    <button
      ref={fabRef}
      className={`fixed z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-300 flex items-center justify-center select-none ${
        isVisible ? "opacity-100 scale-100" : "opacity-70 scale-95"
      } ${isDragging ? "scale-110 shadow-xl" : "hover:scale-105"} active:scale-95`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      aria-label={`Savatcha - ${totalItems} ta mahsulot`}
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </div>
    </button>
  )
}
