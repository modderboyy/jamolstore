"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/CartContext"
import { ShoppingCart, Phone, MessageCircle, X, Grip } from "lucide-react"
import Link from "next/link"

export function DraggableFab() {
  const { items } = useCart()
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const fabRef = useRef<HTMLDivElement>(null)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Keep within screen bounds
      const maxX = window.innerWidth - 80
      const maxY = window.innerHeight - 80

      setPosition({
        x: Math.max(20, Math.min(newX, maxX)),
        y: Math.max(20, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
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
    if (e.target === fabRef.current || (e.target as Element).closest(".drag-handle")) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isExpanded && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsExpanded(false)} />}

      {/* FAB */}
      <div
        ref={fabRef}
        className="fixed z-50 transition-all duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {isExpanded ? (
          <Card className="w-64 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Tezkor harakatlar</h3>
                <div className="flex items-center gap-2">
                  <div className="drag-handle cursor-grab hover:bg-gray-100 p-1 rounded">
                    <Grip className="w-4 h-4 text-gray-400" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExpanded(false)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/cart">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Savatcha
                    {totalItems > 0 && <Badge className="ml-auto">{totalItems}</Badge>}
                  </Link>
                </Button>

                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <a href="tel:+998901234567">
                    <Phone className="w-4 h-4 mr-2" />
                    Qo'ng'iroq qilish
                  </a>
                </Button>

                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <a href="https://t.me/jamolstroy" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Telegram
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <Button
              size="lg"
              className="w-14 h-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-110"
            >
              <ShoppingCart className="w-6 h-6" />
            </Button>
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {totalItems > 99 ? "99+" : totalItems}
              </Badge>
            )}
          </div>
        )}
      </div>
    </>
  )
}
