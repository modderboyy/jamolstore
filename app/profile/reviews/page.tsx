"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, Star, MessageSquare, Calendar, Package, Check } from "lucide-react"

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
    if (!user) {
      router.push("/login")
      return
    }
    fetchReviews()
  }, [user, router])

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
    return null
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
            <div>
              <h1 className="text-xl font-bold">Sharhlarim</h1>
              <p className="text-sm text-muted-foreground">{reviews.length} ta sharh</p>
            </div>
          </div>
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
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-4 h-4 text-primary" />
                      <h3 className="font-medium">{review.product_name}</h3>
                      {review.is_verified && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Tasdiqlangan</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">{renderStars(review.rating)}</div>
                      <span className="text-sm text-muted-foreground">({review.rating}/5)</span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(review.created_at)}
                  </div>
                </div>

                {review.comment && (
                  <div className="bg-muted/30 rounded-lg p-3 mb-3">
                    <p className="text-sm leading-relaxed">{review.comment}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>ID: {review.id.slice(0, 8)}...</span>
                  <span>{review.is_verified ? "Tasdiqlangan sharh" : "Kutilmoqda"}</span>
                </div>
              </div>
            ))}

            {/* Statistics */}
            {reviews.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-4 mt-6">
                <h3 className="text-lg font-semibold mb-4">Sharh statistikasi</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{reviews.length}</div>
                    <div className="text-sm text-muted-foreground">Jami sharhlar</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {reviews.filter((r) => r.is_verified).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Tasdiqlangan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {reviews.length > 0
                        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                        : "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">O'rtacha baho</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {reviews.filter((r) => r.comment && r.comment.trim()).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Izohli sharhlar</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
