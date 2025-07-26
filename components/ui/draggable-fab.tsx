"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { MessageCircle, Phone, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Position {
  x: number
  y: number
}

export function DraggableFAB() {
  const [position, setPosition] = useState<Position>({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const [mounted, setMounted] = useState(false)

  const fabRef = useRef<HTMLDivElement>(null)
  const dragThreshold = 5 // pixels

  useEffect(() => {
    setMounted(true)

    // Load saved position from localStorage
    if (typeof window !== "undefined") {
      const savedPosition = localStorage.getItem("jamolstroy_fab_position")
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition)
          setPosition(parsed)
        } catch (error) {
          console.error("Error parsing FAB position:", error)
        }
      }
    }
  }, [])

  const savePosition = (newPosition: Position) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("jamolstroy_fab_position", JSON.stringify(newPosition))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setHasMoved(false)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    setIsDragging(true)
    setHasMoved(false)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  useEffect(() => {
    if (!mounted) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }

      // Check if moved beyond threshold
      const distance = Math.sqrt(Math.pow(newPosition.x - position.x, 2) + Math.pow(newPosition.y - position.y, 2))

      if (distance > dragThreshold) {
        setHasMoved(true)
      }

      // Constrain to viewport
      const maxX = window.innerWidth - 60
      const maxY = window.innerHeight - 60

      setPosition({
        x: Math.max(0, Math.min(newPosition.x, maxX)),
        y: Math.max(0, Math.min(newPosition.y, maxY)),
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return

      const touch = e.touches[0]
      const newPosition = {
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      }

      // Check if moved beyond threshold
      const distance = Math.sqrt(Math.pow(newPosition.x - position.x, 2) + Math.pow(newPosition.y - position.y, 2))

      if (distance > dragThreshold) {
        setHasMoved(true)
      }

      // Constrain to viewport
      const maxX = window.innerWidth - 60
      const maxY = window.innerHeight - 60

      setPosition({
        x: Math.max(0, Math.min(newPosition.x, maxX)),
        y: Math.max(0, Math.min(newPosition.y, maxY)),
      })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        savePosition(position)

        // If didn't move much, treat as click
        if (!hasMoved) {
          setIsExpanded(!isExpanded)
        }
      }
    }

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false)
        savePosition(position)

        // If didn't move much, treat as tap
        if (!hasMoved) {
          setIsExpanded(!isExpanded)
        }
      }
    }

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
  }, [isDragging, dragStart, position, hasMoved, isExpanded, mounted])

  const handleCall = () => {
    if (typeof window !== "undefined") {
      window.location.href = "tel:+998901234567"
    }
    setIsExpanded(false)
  }

  const handleMessage = () => {
    if (typeof window !== "undefined") {
      window.open("https://t.me/jamolstroy_support", "_blank")
    }
    setIsExpanded(false)
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      {isExpanded && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsExpanded(false)} />}

      {/* FAB */}
      <div
        ref={fabRef}
        className="fixed z-50 select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {/* Expanded Menu */}
        {isExpanded && (
          <Card className="absolute bottom-16 right-0 w-48 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleCall}>
                  <Phone className="w-4 h-4 mr-2" />
                  Qo'ng'iroq qilish
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleMessage}>
                  <Send className="w-4 h-4 mr-2" />
                  Telegram orqali
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main FAB Button */}
        <div
          className={`w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
            isDragging ? "scale-110" : "hover:scale-105"
          } ${isExpanded ? "rotate-45" : ""}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {isExpanded ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </div>
      </div>
    </>
  )
}
