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
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const fabRef = useRef<HTMLButtonElement>(null)
  const totalItems = getTotalItems()

  useEffect(() => {
    // Set initial position on mount
    const updateInitialPosition = () => {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 200,
      })
    }

    updateInitialPosition()
    window.addEventListener("resize", updateInitialPosition)
    return () => window.removeEventListener("resize", updateInitialPosition)
  }, [])

  const handleStart = (clientX: number, clientY: number, e: any) => {
    e.preventDefault()
    e.stopPropagation()

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
    const maxX = window.innerWidth - 56
    const maxY = window.innerHeight - 56

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleEnd = () => {
    if (isDragging) {
      setIsDragging(false)

      // Snap to nearest edge
      const centerX = position.x + 28
      const snapToLeft = centerX < window.innerWidth / 2

      setPosition((prev) => ({
        x: snapToLeft ? 20 : window.innerWidth - 76,
        y: Math.max(20, Math.min(window.innerHeight - 76, prev.y)),
      }))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY, e)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY, e)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only trigger click if not dragged
    if (!hasMoved && !isDragging) {
      onCartClick()
    }
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
  }, [isDragging, dragStart, position])

  if (totalItems === 0) return null

  return (
    <button
      ref={fabRef}
      className={`fixed z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-200 flex items-center justify-center select-none ${
        isDragging ? "scale-110 shadow-xl cursor-grabbing" : "hover:scale-105 cursor-pointer"
      } active:scale-95`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      aria-label={`Savatcha - ${totalItems} ta mahsulot`}
    >
      <div className="relative pointer-events-none">
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold min-w-[20px]">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </div>
    </button>
  )
}
