"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, MessageSquare, Calendar } from "lucide-react"

interface Review {
  id: string
  product_id: string
  product_title: string
  product_image_url: string
  rating: number
  comment: string
  created_at: string
}

export default function ProfileReviewsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !user) {
      router.push("/login")
      return
    }
    if (mounted && user) {
      fetchReviews()
    }
  }, [user, router, mounted])

  const fetchReviews = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/reviews", {
        headers: {
          "x-user-id": user.id,
          authorization: `Bearer ${user.id}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      } else {
        console.error("Failed to fetch reviews")
      }
    } catch (error) {
      console.error("Reviews fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`)
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

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Mening sharhlarim</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {reviews.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sharhlar yo'q</h3>
            <p className="text-muted-foreground mb-4">Siz hali hech qanday mahsulotga sharh yozmagansiz</p>
            <Button onClick={() => router.push("/catalog")}>Mahsulotlarni ko'rish</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={review.product_image_url || "/placeholder.svg"}
                      alt={review.product_title}
                      className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                      onClick={() => handleProductClick(review.product_id)}
                    />

                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium text-lg mb-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleProductClick(review.product_id)}
                      >
                        {review.product_title}
                      </h3>

                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center space-x-1">{renderStars(review.rating)}</div>
                        <span className="text-sm text-muted-foreground">{review.rating}/5</span>
                      </div>

                      {review.comment && <p className="text-muted-foreground mb-3 leading-relaxed">{review.comment}</p>}

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
