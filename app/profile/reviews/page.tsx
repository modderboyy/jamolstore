"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, Star, Calendar } from "lucide-react"
import Image from "next/image"

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
  const { user, getAuthenticatedClient } = useAuth()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchReviews()
  }, [user, router])

  const fetchReviews = async () => {
    if (!user) return

    try {
      const authClient = getAuthenticatedClient()
      const { data, error } = await authClient.rpc("get_user_reviews", {
        user_id_param: user.id,
      })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error("Reviews fetch error:", error)
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

  if (loading) {
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Mening sharhlarim</h1>
            <p className="text-sm text-muted-foreground">{reviews.length} ta sharh</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Sharhlar yo'q</h3>
            <p className="text-muted-foreground mb-6">Siz hali hech qanday mahsulotga sharh bermagansiz</p>
            <button
              onClick={() => router.push("/orders")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Buyurtmalarni ko'rish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={review.product_image || "/placeholder.svg"}
                      alt={review.product_name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold line-clamp-2 mb-1">{review.product_name}</h3>
                        <div className="flex items-center space-x-1 mb-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground ml-2">{review.rating}/5</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(review.created_at)}</span>
                      </div>
                    </div>

                    {review.comment && (
                      <div className="bg-muted/30 rounded-lg p-3 mb-3">
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => router.push(`/product/${review.product_id}`)}
                        className="text-sm text-primary hover:underline"
                      >
                        Mahsulotni ko'rish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
