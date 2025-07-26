"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, Star, MessageSquare, Calendar } from "lucide-react"

interface Review {
  id: string
  product_name: string
  rating: number
  comment: string
  is_verified: boolean
  created_at: string
}

export default function ReviewsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchReviews()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchReviews = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc("get_user_reviews", {
        user_id_param: user.id,
      })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error("Reviews fetch error:", error)
    } finally {
      setIsLoading(false)
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
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
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

  if (!user) {
    router.push("/login")
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
          <h1 className="text-xl font-bold">Sharhlarim</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {reviews.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Hech qanday sharh yo'q</h3>
            <p className="text-muted-foreground mb-4">Siz hali hech qanday mahsulotga sharh qoldirmadingiz</p>
            <button
              onClick={() => router.push("/orders")}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Buyurtmalarimni ko'rish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{review.product_name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">{renderStars(review.rating)}</div>
                      {review.is_verified && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full">
                          Tasdiqlangan
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(review.created_at)}
                  </div>
                </div>

                {review.comment && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm">{review.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
