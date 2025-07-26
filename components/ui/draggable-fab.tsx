"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/CartContext"

export function DraggableFAB() {
  const router = useRouter()
  const { uniqueItemsCount } = useCart()
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
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

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Constrain to window bounds
    const maxX = window.innerWidth - 56 // FAB width
    const maxY = window.innerHeight - 56 // FAB height

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    // Constrain to window bounds
    const maxX = window.innerWidth - 56 // FAB width
    const maxY = window.innerHeight - 56 // FAB height

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, dragStart])

  const handleClick = () => {
    if (!isDragging) {
      router.push("/cart")
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
        isDragging ? "scale-110 cursor-grabbing" : "cursor-grab hover:scale-110"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? "scale(1.1)" : "scale(1)",
        transition: isDragging ? "none" : "transform 0.2s ease",
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
