"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ShoppingCart, MessageCircle, Phone } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useTelegram } from "@/contexts/TelegramContext"

interface DraggableFabProps {
  onCartClick?: () => void
}

export function DraggableFab({ onCartClick }: DraggableFabProps) {
  const { getTotalItems } = useCart()
  const { isTelegramWebApp } = useTelegram()
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isExpanded, setIsExpanded] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)
  const totalItems = getTotalItems()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
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

    const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragStart.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragStart.y))

    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragStart])

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
    const newX = Math.max(0, Math.min(window.innerWidth - 60, touch.clientX - dragStart.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - dragStart.y))

    setPosition({ x: newX, y: newY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, dragStart])

  const handleMainClick = () => {
    if (!isDragging) {
      if (isExpanded) {
        onCartClick?.()
      } else {
        setIsExpanded(true)
      }
    }
  }

  const handleContactClick = () => {
    if (isTelegramWebApp) {
      window.open("https://t.me/jamolstroy_admin", "_blank")
    } else {
      window.open("tel:+998901234567", "_self")
    }
    setIsExpanded(false)
  }

  const handleSupportClick = () => {
    if (isTelegramWebApp) {
      window.open("https://t.me/jamolstroy_support", "_blank")
    } else {
      window.open("https://t.me/jamolstroy_support", "_blank")
    }
    setIsExpanded(false)
  }

  return (
    <div
      ref={fabRef}
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          {/* Support Button */}
          <button
            onClick={handleSupportClick}
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Yordam"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          {/* Contact Button */}
          <button
            onClick={handleContactClick}
            className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Bog'lanish"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main FAB */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleMainClick}
        className={`w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 relative ${
          isDragging ? "scale-110" : "hover:scale-105"
        } ${isExpanded ? "rotate-45" : ""}`}
        title="Savatcha"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>
    </div>
  )
}
