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
        .limit(8)

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
        <div className="container mx-auto px-3 py-2">
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-xl mb-1"></div>
                <div className="w-8 h-2 bg-muted rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-3 py-2">
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="flex-shrink-0 group transition-all duration-300 hover:scale-105 category-item"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mb-1 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300 shadow-sm group-hover:shadow-md border border-primary/10">
                <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform duration-300">
                  {getIconForCategory(category.icon_name)}
                </span>
              </div>
              <p className="text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors duration-300 leading-tight max-w-[48px] sm:max-w-[56px] truncate">
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
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center mb-1 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300 shadow-sm group-hover:shadow-md border border-border group-hover:border-primary/20">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
            <p className="text-xs font-medium text-center text-muted-foreground group-hover:text-primary transition-colors duration-300 leading-tight max-w-[48px] sm:max-w-[56px] truncate">
              Barchasi
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
