"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Phone, HeadphonesIcon } from "lucide-react"
import { useTelegram } from "@/contexts/TelegramContext"

interface ContactFabProps {
  onContactClick?: () => void
}

export function ContactFab({ onContactClick }: ContactFabProps) {
  const { isTelegramWebApp } = useTelegram()
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const fabRef = useRef<HTMLDivElement>(null)

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = fabRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Keep FAB within viewport bounds
    const maxX = window.innerWidth - 64
    const maxY = window.innerHeight - 64

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    const touch = e.touches[0]
    const rect = fabRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
    }
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
    e.preventDefault()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    // Keep FAB within viewport bounds
    const maxX = window.innerWidth - 64
    const maxY = window.innerHeight - 64

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
    e.preventDefault()
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    if (!isDragging) {
      setIsOpen(!isOpen)
    }
  }

  const handleContactClick = (type: "telegram" | "phone" | "support") => {
    if (type === "telegram") {
      window.open("https://t.me/jamolstroy_admin", "_blank")
    } else if (type === "phone") {
      window.open("tel:+998901234567", "_self")
    } else if (type === "support") {
      window.open("mailto:support@jamolstroy.uz", "_self")
    }
    setIsOpen(false)
    onContactClick?.()
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)
      document.addEventListener("touchmove", handleMouseMove as any)
      document.addEventListener("touchend", handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
      document.removeEventListener("touchmove", handleMouseMove as any)
      document.removeEventListener("touchend", handleGlobalMouseUp)
    }
  }, [isDragging, dragStart])

  if (isTelegramWebApp) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
          onTouchStart={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div
        ref={fabRef}
        className="fixed z-50 select-none"
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {/* Contact Options */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col space-y-3 animate-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => handleContactClick("telegram")}
              className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span className="text-sm font-medium">Telegram</span>
            </button>
            <button
              onClick={() => handleContactClick("phone")}
              className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Phone className="w-5 h-5" />
              <span className="text-sm font-medium">Qo'ng'iroq</span>
            </button>
            <button
              onClick={() => handleContactClick("support")}
              className="flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <HeadphonesIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Yordam</span>
            </button>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          className={`
            w-14 h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary 
            text-primary-foreground rounded-full shadow-lg flex items-center justify-center
            transition-all duration-200 hover:scale-110 active:scale-95
            ${isDragging ? "scale-110 shadow-xl" : ""}
          `}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>
    </>
  )
}
