"use client"

import type React from "react"
import { Star, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Product {
  id: string
  name_uz: string
  price: number
  unit: string
  images: string[]
  is_featured: boolean
  is_popular: boolean
  stock_quantity: number
  min_order_quantity: number
  rating?: number
  review_count?: number
  category: {
    name_uz: string
  }
}

interface ProductCardProps {
  product: Product
  onQuickView: (productId: string) => void
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-3 h-3">
            <Star className="w-3 h-3 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
          </div>,
        )
      } else {
        stars.push(<Star key={i} className="w-3 h-3 text-gray-300" />)
      }
    }
    return stars
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      router.push("/login")
      return
    }

    setIsAddingToCart(true)
    try {
      await addToCart(product.id, product.min_order_quantity || 1)
    } catch (error) {
      console.error("Savatga qo'shishda xatolik:", error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <div
      onClick={() => onQuickView(product.id)}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-clean transition-all cursor-pointer product-card group"
    >
      {/* Product Image */}
      <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3 relative">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name_uz}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="w-8 h-8 bg-border rounded" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.is_featured && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded">TOP</span>
          )}
          {product.is_popular && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded">HIT</span>
          )}
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="absolute bottom-2 right-2 w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/90 disabled:opacity-50"
        >
          {isAddingToCart ? (
            <div className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-card-foreground line-clamp-2 text-sm leading-tight">{product.name_uz}</h3>

        {/* Rating */}
        {product.rating && product.review_count && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">{renderStars(product.rating)}</div>
            <span className="text-xs font-medium text-card-foreground">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({product.review_count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline space-x-1">
          <span className="text-lg font-bold text-card-foreground">{formatPrice(product.price)}</span>
          <span className="text-xs text-muted-foreground">so'm</span>
        </div>

        <div className="text-xs text-muted-foreground">
          {product.unit} | {product.category.name_uz}
        </div>

        {/* Stock Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Omborda: {product.stock_quantity} {product.unit}
          </span>
          {product.stock_quantity < 10 && <span className="text-xs text-orange-600 font-medium">Kam qoldi!</span>}
        </div>
      </div>
    </div>
  )
}
