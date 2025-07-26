"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ShoppingCart, Grip } from "lucide-react"
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Keep within viewport bounds
      const maxX = window.innerWidth - 64
      const maxY = window.innerHeight - 64

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
      setHasMoved(true)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      // Reset hasMoved after a short delay to allow click detection
      setTimeout(() => setHasMoved(false), 100)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragStart])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!fabRef.current) return

    const rect = fabRef.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
    setHasMoved(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (hasMoved) {
      e.preventDefault()
      return
    }
    onCartClick()
  }

  if (totalItems === 0) return null

  return (
    <button
      ref={fabRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={`fixed z-50 w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${
        isDragging ? "cursor-grabbing scale-110" : "cursor-grab hover:scale-105"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: "none",
      }}
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      </div>

      {/* Drag indicator */}
      <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Grip className="w-3 h-3 text-primary-foreground/70" />
      </div>
    </button>
  )
}
