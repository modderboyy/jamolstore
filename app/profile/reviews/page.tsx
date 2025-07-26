"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Star, ArrowLeft, Calendar, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Review {
  id: string
  product_name: string
  rating: number
  comment: string
  created_at: string
  product_id: string
  product_image: string
}

export default function ProfileReviewsPage() {
  const { user, getAuthToken } = useAuth()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    fetchReviews()
  }, [user, router])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch("/api/reviews", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reviews")
      }

      if (data.success) {
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error("Reviews fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star key={index} className={`w-4 h-4 ${index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 5:
        return "Juda yaxshi"
      case 4:
        return "Yaxshi"
      case 3:
        return "O'rtacha"
      case 2:
        return "Yomon"
      case 1:
        return "Juda yomon"
      default:
        return "Baholanmagan"
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "bg-green-100 text-green-800"
    if (rating >= 3) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Mening sharhlarim</h1>
                <p className="text-sm text-muted-foreground">
                  {loading ? "Yuklanmoqda..." : `${reviews.length} ta sharh`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Xatolik yuz berdi</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchReviews} variant="outline">
                Qayta urinish
              </Button>
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Hali sharhlar yo'q</h3>
              <p className="text-muted-foreground mb-4">Siz hali hech qanday mahsulotga sharh yozmagansiz</p>
              <Link href="/catalog">
                <Button>Mahsulotlarni ko'rish</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={review.product_image || "/placeholder.svg"}
                        alt={review.product_name}
                        className="w-16 h-16 rounded-lg object-cover bg-muted"
                      />
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      {/* Product Name */}
                      <Link
                        href={`/product/${review.product_id}`}
                        className="block hover:text-primary transition-colors"
                      >
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{review.product_name}</h3>
                      </Link>

                      {/* Rating and Date */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">{renderStars(review.rating)}</div>
                          <Badge className={getRatingColor(review.rating)}>{getRatingText(review.rating)}</Badge>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(review.created_at)}</span>
                        </div>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
