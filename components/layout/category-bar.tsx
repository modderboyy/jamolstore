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
        <div className="container mx-auto px-4 py-2 md:py-3">
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 animate-pulse">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-2xl mb-2"></div>
                <div className="w-12 h-3 bg-muted rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-2 md:py-3">
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="flex-shrink-0 group transition-all duration-300 hover:scale-105"
              style={{
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-2 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300 shadow-sm group-hover:shadow-md border border-primary/10">
                <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform duration-300">
                  {getIconForCategory(category.icon_name)}
                </span>
              </div>
              <p className="text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                {category.name_uz}
              </p>
            </button>
          ))}

          <button
            onClick={() => router.push("/catalog-list")}
            className="flex-shrink-0 group transition-all duration-300 hover:scale-105"
            style={{
              animation: `slideInUp 0.6s ease-out ${categories.length * 0.1}s both`,
            }}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mb-2 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300 shadow-sm group-hover:shadow-md border border-border group-hover:border-primary/20">
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
            <p className="text-xs font-medium text-center text-muted-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
              Barchasi
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
