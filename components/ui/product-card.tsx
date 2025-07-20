"use client"

import { Star, Clock, Calendar } from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name_uz: string
  price: number
  unit: string
  product_type: "sale" | "rental"
  rental_price_per_unit?: number
  rental_time_unit?: "hour" | "day" | "week" | "month"
  images: string[]
  is_featured: boolean
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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const getRentalTimeText = (unit?: string) => {
    switch (unit) {
      case "hour":
        return "soat"
      case "day":
        return "kun"
      case "week":
        return "hafta"
      case "month":
        return "oy"
      default:
        return "vaqt"
    }
  }

  const getRentalIcon = (unit?: string) => {
    switch (unit) {
      case "hour":
        return <Clock className="w-3 h-3" />
      case "day":
      case "week":
      case "month":
        return <Calendar className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
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

  return (
    <div
      onClick={() => onQuickView(product.id)}
      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Product Image */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name_uz}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="w-12 h-12 bg-muted-foreground/20 rounded-lg" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.is_featured && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">TOP</span>
          )}
          {product.product_type === "rental" && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded flex items-center space-x-1">
              {getRentalIcon(product.rental_time_unit)}
              <span>IJARA</span>
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-foreground line-clamp-2 text-sm mb-1">{product.name_uz}</h3>
          <p className="text-xs text-muted-foreground">{product.category.name_uz}</p>
        </div>

        {/* Rating */}
        {product.rating && product.review_count && (
          <div className="flex items-center space-x-1 mb-2">
            <div className="flex items-center space-x-1">{renderStars(product.rating)}</div>
            <span className="text-xs text-muted-foreground">({product.review_count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline space-x-1">
          {product.product_type === "rental" && product.rental_price_per_unit ? (
            <>
              <span className="text-lg font-bold text-blue-600">{formatPrice(product.rental_price_per_unit)}</span>
              <span className="text-xs text-muted-foreground">so'm/{getRentalTimeText(product.rental_time_unit)}</span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
              <span className="text-xs text-muted-foreground">so'm/{product.unit}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
