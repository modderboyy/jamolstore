"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { CategoryBar } from "@/components/layout/category-bar"
import { AdBanner } from "@/components/layout/ad-banner"
import { ProductCard } from "@/components/ui/product-card"
import { DraggableFAB } from "@/components/ui/draggable-fab"
import { supabase } from "@/lib/supabase"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, Clock, Users } from "lucide-react"

interface Product {
  id: string
  title: string
  description: string
  price: number
  image_url: string
  category: string
  rating: number
  reviews_count: number
  is_featured: boolean
  created_at: string
}

interface Worker {
  id: string
  first_name: string
  last_name: string
  specialization: string
  hourly_rate: number
  rating: number
  reviews_count: number
  avatar_url: string
  is_available: boolean
}

export default function HomePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          title,
          description,
          price,
          image_url,
          category,
          is_featured,
          created_at,
          product_reviews (rating)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20)

      if (productsError) {
        console.error("Products fetch error:", productsError)
      } else {
        const processedProducts = (productsData || []).map((product) => ({
          ...product,
          rating:
            product.product_reviews?.length > 0
              ? product.product_reviews.reduce((sum: number, review: any) => sum + review.rating, 0) /
                product.product_reviews.length
              : 0,
          reviews_count: product.product_reviews?.length || 0,
        }))

        setProducts(processedProducts)
        setFeaturedProducts(processedProducts.filter((p) => p.is_featured))
      }

      // Fetch workers
      const { data: workersData, error: workersError } = await supabase
        .from("workers")
        .select("*")
        .eq("is_available", true)
        .order("rating", { ascending: false })
        .limit(10)

      if (workersError) {
        console.error("Workers fetch error:", workersError)
      } else {
        setWorkers(workersData || [])
      }
    } catch (error) {
      console.error("Data fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`)
  }

  const handleWorkerClick = (workerId: string) => {
    router.push(`/workers?id=${workerId}`)
  }

  const handleCategoryClick = (category: string) => {
    router.push(`/catalog?category=${encodeURIComponent(category)}`)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />
      <CategoryBar />

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Ad Banner */}
        <AdBanner />

        {/* Featured Products Carousel */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Tavsiya etilgan mahsulotlar
              </h2>
              <button
                onClick={() => router.push("/catalog?featured=true")}
                className="text-sm text-primary hover:underline"
              >
                Barchasini ko'rish
              </button>
            </div>

            <Carousel className="w-full">
              <CarouselContent>
                {featuredProducts.map((product) => (
                  <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <ProductCard product={product} onClick={() => handleProductClick(product.id)} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </section>
        )}

        {/* Top Workers */}
        {workers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                Eng yaxshi ishchilar
              </h2>
              <button onClick={() => router.push("/workers")} className="text-sm text-primary hover:underline">
                Barchasini ko'rish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.slice(0, 6).map((worker) => (
                <Card
                  key={worker.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleWorkerClick(worker.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={worker.avatar_url || "/placeholder-user.jpg"}
                        alt={`${worker.first_name} ${worker.last_name}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {worker.first_name} {worker.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{worker.specialization}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-primary">
                            {worker.hourly_rate.toLocaleString()} so'm/soat
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">
                              {worker.rating.toFixed(1)} ({worker.reviews_count})
                            </span>
                          </div>
                        </div>
                        {worker.is_available && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Mavjud
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recent Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-500" />
              Yangi mahsulotlar
            </h2>
            <button
              onClick={() => router.push("/catalog?sort=newest")}
              className="text-sm text-primary hover:underline"
            >
              Barchasini ko'rish
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-card rounded-lg p-4 animate-pulse">
                  <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.slice(0, 12).map((product) => (
                <ProductCard key={product.id} product={product} onClick={() => handleProductClick(product.id)} />
              ))}
            </div>
          )}
        </section>

        {/* Categories Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
              Kategoriyalar
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Qurilish materiallari", icon: "🏗️", color: "bg-blue-100 text-blue-800" },
              { name: "Elektr jihozlari", icon: "⚡", color: "bg-yellow-100 text-yellow-800" },
              { name: "Santexnika", icon: "🚿", color: "bg-cyan-100 text-cyan-800" },
              { name: "Asboblar", icon: "🔧", color: "bg-green-100 text-green-800" },
              { name: "Bo'yoqlar", icon: "🎨", color: "bg-purple-100 text-purple-800" },
              { name: "Boshqalar", icon: "📦", color: "bg-gray-100 text-gray-800" },
            ].map((category) => (
              <Card
                key={category.name}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h3 className="text-sm font-medium">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <DraggableFAB />
      <BottomNavigation />
    </div>
  )
}
