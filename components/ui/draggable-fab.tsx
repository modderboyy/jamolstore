"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/CartContext"

export function DraggableFab() {
  const router = useRouter()
  const { totalItems } = useCart()
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const fabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Set initial position to bottom right
    const updatePosition = () => {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      setPosition({
        x: windowWidth - 80, // 80px from right (fab width + margin)
        y: windowHeight - 180, // 180px from bottom (above bottom nav)
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Constrain to viewport
    const maxX = window.innerWidth - 64 // fab width
    const maxY = window.innerHeight - 64 // fab height

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    // Constrain to viewport
    const maxX = window.innerWidth - 64 // fab width
    const maxY = window.innerHeight - 64 // fab height

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    if (!isDragging) {
      router.push("/cart")
    }
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  if (totalItems === 0) return null

  return (
    <button
      ref={fabRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className="fixed w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-50 cursor-move select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? "scale(1.1)" : "scale(1)",
      }}
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </div>
    </button>
  )
}
