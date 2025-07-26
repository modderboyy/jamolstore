"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Phone, ShoppingCart, X } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { supabase } from "@/lib/supabase"

interface CompanyInfo {
  phone_number: string
  telegram_username: string
}

export function DraggableFab() {
  const { items } = useCart()
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const fabRef = useRef<HTMLDivElement>(null)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("company")
        .select("phone_number, telegram_username")
        .eq("is_active", true)
        .single()

      if (error) throw error
      setCompanyInfo(data)
    } catch (error) {
      console.error("Company info error:", error)
    }
  }

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

    // Keep FAB within viewport bounds
    const maxX = window.innerWidth - 60
    const maxY = window.innerHeight - 60

    setPosition({
      x: Math.max(20, Math.min(newX, maxX)),
      y: Math.max(20, Math.min(newY, maxY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
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

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    const maxX = window.innerWidth - 60
    const maxY = window.innerHeight - 60

    setPosition({
      x: Math.max(20, Math.min(newX, maxX)),
      y: Math.max(20, Math.min(newY, maxY)),
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleCall = () => {
    if (companyInfo?.phone_number) {
      window.open(`tel:${companyInfo.phone_number}`, "_self")
    }
    setIsExpanded(false)
  }

  const handleTelegram = () => {
    if (companyInfo?.telegram_username) {
      window.open(`https://t.me/${companyInfo.telegram_username}`, "_blank")
    }
    setIsExpanded(false)
  }

  const handleCart = () => {
    window.location.href = "/cart"
    setIsExpanded(false)
  }

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isDragging) {
      setIsExpanded(!isExpanded)
    }
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
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="absolute bottom-16 left-0 flex flex-col space-y-2 animate-in slide-in-from-bottom-2">
          {/* Cart Button */}
          <button
            onClick={handleCart}
            className="relative w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>

          {/* Phone Button */}
          <button
            onClick={handleCall}
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Telegram Button */}
          <button
            onClick={handleTelegram}
            className="w-12 h-12 bg-sky-500 hover:bg-sky-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={toggleExpanded}
        className={`w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isExpanded ? "rotate-45" : "hover:scale-110"
        }`}
      >
        {isExpanded ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Cart Badge */}
      {!isExpanded && totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </div>
  )
}
