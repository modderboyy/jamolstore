"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ChevronRight } from "lucide-react"

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

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("sort_order")
        .limit(7)

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Kategoriyalarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/catalog?category=${categoryId}`)
  }

  const getIconForCategory = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      construction: "🏗️",
      electrical: "⚡",
      plumbing: "🚿",
      paint: "🎨",
      tools: "🔧",
      hardware: "🔩",
      garden: "🌱",
      safety: "🦺",
    }
    return iconMap[iconName] || "📦"
  }

  if (loading) {
    return (
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile - Single row */}
          <div className="md:hidden flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-xl mb-1"></div>
                <div className="w-8 h-2 bg-muted rounded mx-auto"></div>
              </div>
            ))}
          </div>

          {/* Desktop - Grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-xl flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-full mb-1"></div>
                  <div className="h-2 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3">
        {/* Mobile - Single row horizontal scroll */}
        <div className="md:hidden flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="flex-shrink-0 group transition-all duration-300 hover:scale-105 category-item"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mb-1 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300 shadow-sm group-hover:shadow-md border border-primary/10">
                <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                  {getIconForCategory(category.icon_name)}
                </span>
              </div>
              <p className="text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors duration-300 leading-tight max-w-[48px] truncate">
                {category.name_uz}
              </p>
            </button>
          ))}

          <button
            onClick={() => router.push("/catalog-list")}
            className="flex-shrink-0 group transition-all duration-300 hover:scale-105 category-item"
            style={{
              animationDelay: `${categories.length * 0.1}s`,
            }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center mb-1 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300 shadow-sm group-hover:shadow-md border border-border group-hover:border-primary/20">
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
            <p className="text-xs font-medium text-center text-muted-foreground group-hover:text-primary transition-colors duration-300 leading-tight max-w-[48px] truncate">
              Barchasi
            </p>
          </button>
        </div>

        {/* Desktop - Grid layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="flex items-center space-x-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all duration-300 hover:scale-105 group"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300 shadow-sm group-hover:shadow-md border border-primary/10 flex-shrink-0">
                <span className="text-xl group-hover:scale-110 transition-transform duration-300">
                  {getIconForCategory(category.icon_name)}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                  {category.name_uz}
                </p>
              </div>
            </button>
          ))}

          <button
            onClick={() => router.push("/catalog-list")}
            className="flex items-center space-x-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all duration-300 hover:scale-105 group"
            style={{
              animationDelay: `${categories.length * 0.1}s`,
            }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300 shadow-sm group-hover:shadow-md border border-border group-hover:border-primary/20 flex-shrink-0">
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                Barchasi
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
