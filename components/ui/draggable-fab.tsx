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
  const [hasMoved, setHasMoved] = useState(false)
  const fabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Set initial position (bottom right)
    const updatePosition = () => {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      setPosition({
        x: windowWidth - 80, // 80px from right
        y: windowHeight - 160, // 160px from bottom (above bottom nav)
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
    if (!isDragging) return

    const newX = clientX - dragStart.x
    const newY = clientY - dragStart.y

    // Check if moved significantly
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      setHasMoved(true)
    }

    // Constrain to window bounds
    const maxX = window.innerWidth - 56 // FAB width
    const maxY = window.innerHeight - 56 // FAB height

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
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
      e.preventDefault()
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
  }, [isDragging, dragStart])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only trigger click if not dragged
    if (!hasMoved && onCartClick) {
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
        isDragging ? "scale-110 cursor-grabbing" : "cursor-pointer hover:scale-110"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? "scale(1.1)" : "scale(1)",
        transition: isDragging ? "none" : "transform 0.2s ease",
        touchAction: "none",
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
