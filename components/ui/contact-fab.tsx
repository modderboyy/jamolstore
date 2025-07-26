"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Phone, MessageCircle, Mail, X, Plus } from "lucide-react"

export function ContactFab() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!mounted) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!mounted) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !mounted) return

    const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragStart.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragStart.y))

    setPosition({ x: newX, y: newY })
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !mounted) return

    const touch = e.touches[0]
    const newX = Math.max(0, Math.min(window.innerWidth - 60, touch.clientX - dragStart.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - dragStart.y))

    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (!mounted) return

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, mounted])

  const handleCall = () => {
    if (!mounted) return
    window.open("tel:+998901234567", "_self")
  }

  const handleTelegram = () => {
    if (!mounted) return
    window.open("https://t.me/jamolstroy", "_blank")
  }

  const handleEmail = () => {
    if (!mounted) return
    window.open("mailto:support@jamolstroy.uz", "_self")
  }

  const handleFabClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isDragging) {
      setIsOpen(!isOpen)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div
      ref={fabRef}
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
    >
      {/* Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 space-y-3">
          <button
            onClick={handleEmail}
            className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Email"
          >
            <Mail className="w-5 h-5" />
          </button>

          <button
            onClick={handleTelegram}
            className="flex items-center justify-center w-12 h-12 bg-blue-400 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Telegram"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          <button
            onClick={handleCall}
            className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Qo'ng'iroq qilish"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main FAB */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleFabClick}
        className={`
          flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200
          ${isDragging ? "scale-110" : "hover:scale-105"}
          ${
            isOpen
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          }
          text-white cursor-move
        `}
        title={isOpen ? "Yopish" : "Bog'lanish"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  )
}
