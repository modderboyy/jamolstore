"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ShoppingCart, MessageCircle, Phone, X } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useTelegram } from "@/contexts/TelegramContext"

interface DraggableFabProps {
  onCartClick?: () => void
}

export function DraggableFab({ onCartClick }: DraggableFabProps) {
  const { items } = useCart()
  const { isTelegramWebApp } = useTelegram()
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  // Load position from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fabPosition")
      if (saved) {
        try {
          const savedPosition = JSON.parse(saved)
          setPosition(savedPosition)
        } catch (error) {
          console.error("Error loading FAB position:", error)
        }
      }
    }
  }, [])

  // Save position to localStorage
  const savePosition = (newPosition: { x: number; y: number }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fabPosition", JSON.stringify(newPosition))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setHasMoved(false)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
    e.preventDefault()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setHasMoved(false)
    const touch = e.touches[0]
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Check if moved more than 5px to distinguish from click
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      setHasMoved(true)
    }

    // Constrain to viewport
    const maxX = window.innerWidth - 60
    const maxY = window.innerHeight - 60

    const constrainedPosition = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    }

    setPosition(constrainedPosition)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    // Check if moved more than 5px to distinguish from tap
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      setHasMoved(true)
    }

    // Constrain to viewport
    const maxX = window.innerWidth - 60
    const maxY = window.innerHeight - 60

    const constrainedPosition = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    }

    setPosition(constrainedPosition)
    e.preventDefault()
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      savePosition(position)
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false)
      savePosition(position)
    }
  }

  const handleMainClick = () => {
    // Only trigger click if we haven't moved (not a drag)
    if (!hasMoved) {
      if (isExpanded) {
        setIsExpanded(false)
      } else {
        onCartClick?.()
      }
    }
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasMoved) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleContactClick = (type: "telegram" | "phone") => {
    if (type === "telegram") {
      window.open("https://t.me/jamolstroy_admin", "_blank")
    } else if (type === "phone") {
      window.open("tel:+998901234567", "_self")
    }
    setIsExpanded(false)
  }

  // Add global event listeners
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
  }, [isDragging, dragStart, position])

  // Don't show FAB in Telegram Web App
  if (isTelegramWebApp) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      {isExpanded && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsExpanded(false)} />}

      <div
        ref={fabRef}
        className={`fixed z-50 transition-all duration-200 ${
          isDragging ? "scale-110 shadow-2xl" : "shadow-lg hover:shadow-xl"
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div className="flex flex-col items-end space-y-3">
          {/* Additional Action Buttons - Show when expanded */}
          {isExpanded && (
            <div className="flex flex-col space-y-2 animate-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => handleContactClick("telegram")}
                className="flex items-center space-x-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Telegram</span>
              </button>
              <button
                onClick={() => handleContactClick("phone")}
                className="flex items-center space-x-3 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
              >
                <Phone className="w-5 h-5" />
                <span className="text-sm font-medium">Qo'ng'iroq</span>
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {/* Expand/Collapse Button */}
            <button
              onClick={handleExpandClick}
              className="w-12 h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              {isExpanded ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            </button>

            {/* Main Cart FAB */}
            <div className="relative">
              <button
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onClick={handleMainClick}
                className="w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <ShoppingCart className="w-6 h-6" />
              </button>
              {totalItems > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {totalItems > 99 ? "99+" : totalItems}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
