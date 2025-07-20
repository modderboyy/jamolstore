"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Category {
  id: string
  name_uz: string
  icon_name: string
  sort_order: number
}

export function CategoryBar() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    checkScrollButtons()
  }, [categories])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("sort_order")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Kategoriyalarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" })
      setTimeout(checkScrollButtons, 300)
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" })
      setTimeout(checkScrollButtons, 300)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/catalog?category=${categoryId}`)
  }

  if (loading) {
    return (
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-2 md:py-3">
          <div className="flex space-x-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 md:h-10 w-20 bg-muted rounded-lg animate-pulse flex-shrink-0"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background border-b border-border relative group">
      <div className="container mx-auto px-4 py-2 md:py-3">
        <div className="relative">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-background transition-all shadow-sm opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}

          {/* Categories */}
          <div
            ref={scrollRef}
            onScroll={checkScrollButtons}
            className="flex space-x-2 md:space-x-3 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* All Categories Button */}
            <button
              onClick={() => router.push("/catalog")}
              className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg whitespace-nowrap text-xs md:text-sm font-medium transition-all flex-shrink-0 bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 hover:from-primary/20 hover:to-primary/10 hover:border-primary/30 shadow-sm"
            >
              Barchasi
            </button>

            {categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg whitespace-nowrap text-xs md:text-sm font-medium transition-all flex-shrink-0 bg-gradient-to-r from-muted to-muted/50 text-muted-foreground hover:from-primary/10 hover:to-primary/5 hover:text-primary hover:border-primary/20 border border-transparent shadow-sm relative overflow-hidden group/item"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* AI Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover/item:from-blue-500/10 group-hover/item:via-purple-500/10 group-hover/item:to-pink-500/10 transition-all duration-500 opacity-0 group-hover/item:opacity-100"></div>

                {/* AI Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover/item:via-white/20 transform -skew-x-12 -translate-x-full group-hover/item:translate-x-full transition-transform duration-700"></div>

                <span className="relative z-10">{category.name_uz}</span>
              </button>
            ))}
          </div>

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-background transition-all shadow-sm opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}

          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  )
}
