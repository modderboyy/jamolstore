"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Phone, Headphones } from "lucide-react"
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
  const fabRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
    e.preventDefault()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
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

    // Keep FAB within viewport bounds
    const maxX = window.innerWidth - 64
    const maxY = window.innerHeight - 64

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

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent) => {
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
      window.open("https://t.me/jamolstroy_support", "_blank")
    }
    setIsOpen(false)
    onContactClick?.()
  }

  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => handleMouseMove(e)
    const handleTouchMoveGlobal = (e: TouchEvent) => handleTouchMove(e)
    const handleMouseUpGlobal = () => handleMouseUp()
    const handleTouchEndGlobal = () => handleTouchEnd()

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMoveGlobal)
      document.addEventListener("touchmove", handleTouchMoveGlobal, { passive: false })
      document.addEventListener("mouseup", handleMouseUpGlobal)
      document.addEventListener("touchend", handleTouchEndGlobal)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMoveGlobal)
      document.removeEventListener("touchmove", handleTouchMoveGlobal)
      document.removeEventListener("mouseup", handleMouseUpGlobal)
      document.removeEventListener("touchend", handleTouchEndGlobal)
    }
  }, [isDragging, dragStart])

  if (isTelegramWebApp) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />}

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
              className="flex items-center space-x-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Send className="w-5 h-5" />
              <span className="text-sm font-medium">Telegram</span>
            </button>
            <button
              onClick={() => handleContactClick("phone")}
              className="flex items-center space-x-3 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              <span className="text-sm font-medium">Qo'ng'iroq</span>
            </button>
            <button
              onClick={() => handleContactClick("support")}
              className="flex items-center space-x-3 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Headphones className="w-5 h-5" />
              <span className="text-sm font-medium">Yordam</span>
            </button>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleClick}
          className={`
            w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
            text-white rounded-full shadow-lg flex items-center justify-center
            transition-all duration-200 hover:scale-110 active:scale-95
            ${isDragging ? "scale-110" : ""}
          `}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>
    </>
  )
}
