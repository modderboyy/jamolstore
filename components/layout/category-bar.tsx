"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  Hammer,
  PipetteIcon as Pipe,
  Square,
  Layers,
  Wrench,
  Zap,
  Palette,
  Shield,
  Truck,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface Category {
  id: string
  name_uz: string
  icon_name: string
}

const iconMap = {
  construction: Hammer,
  pipe: Pipe,
  square: Square,
  layers: Layers,
  wrench: Wrench,
  zap: Zap,
  palette: Palette,
  shield: Shield,
  truck: Truck,
  home: Home,
}

const categoryIconColors = [
  "from-blue-500 to-blue-600",
  "from-green-500 to-green-600",
  "from-purple-500 to-purple-600",
  "from-pink-500 to-pink-600",
  "from-indigo-500 to-indigo-600",
  "from-red-500 to-red-600",
  "from-yellow-500 to-yellow-600",
  "from-teal-500 to-teal-600",
  "from-orange-500 to-orange-600",
  "from-cyan-500 to-cyan-600",
]

export function CategoryBar() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
        .select("id, name_uz, icon_name")
        .eq("is_main", true)
        .eq("is_active", true)
        .order("sort_order")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Kategoriyalarni yuklashda xatolik:", error)
    }
  }

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth)
    }
  }

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = 200
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
      setTimeout(checkScrollButtons, 300)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/catalog?category=${categoryId}`)
  }

  return (
    <div className="bg-background border-b border-border relative overflow-hidden">
      {/* AI Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse"></div>

      <div className="container mx-auto px-4 py-4 relative">
        {/* Mobile - Horizontal Scroll with Gradient Edges */}
        <div className="md:hidden relative">
          {/* Left Gradient */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
          )}

          {/* Right Gradient */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
          )}

          <div
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
            onScroll={checkScrollButtons}
          >
            {categories.map((category, index) => {
              const IconComponent = iconMap[category.icon_name as keyof typeof iconMap] || Square
              const gradientClass = categoryIconColors[index % categoryIconColors.length]

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group flex flex-col items-center space-y-2 min-w-0 flex-shrink-0 p-3 rounded-xl hover:bg-muted/50 transition-all duration-300 ios-button relative overflow-hidden"
                >
                  {/* AI Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>

                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 relative z-10`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center whitespace-nowrap text-foreground group-hover:text-primary transition-colors duration-300 relative z-10">
                    {category.name_uz}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Desktop - Grid with Scroll Controls */}
        <div className="hidden md:block relative">
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto pb-2 scroll-smooth px-12"
            onScroll={checkScrollButtons}
          >
            {categories.map((category, index) => {
              const IconComponent = iconMap[category.icon_name as keyof typeof iconMap] || Square
              const gradientClass = categoryIconColors[index % categoryIconColors.length]

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group flex items-center space-x-3 p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 ios-button min-w-0 flex-shrink-0 relative overflow-hidden"
                >
                  {/* AI Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>

                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 relative z-10`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left relative z-10">
                    <span className="font-medium block whitespace-nowrap text-foreground group-hover:text-primary transition-colors duration-300">
                      {category.name_uz}
                    </span>
                    <span className="text-xs text-muted-foreground">Kategoriya</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
