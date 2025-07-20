"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Hammer, PipetteIcon as Pipe, Square, Layers, Wrench, Zap, Palette, Shield, Truck, Home } from "lucide-react"

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
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
]

export function CategoryBar() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

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

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/catalog?category=${categoryId}`)
  }

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile - Horizontal Scroll */}
        <div className="md:hidden flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.icon_name as keyof typeof iconMap] || Square
            const iconColorClass = categoryIconColors[index % categoryIconColors.length]

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="flex flex-col items-center space-y-2 min-w-0 flex-shrink-0 p-3 rounded-lg hover:bg-muted transition-colors ios-button"
              >
                <div className={`w-12 h-12 ${iconColorClass} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-center whitespace-nowrap text-foreground">
                  {category.name_uz}
                </span>
              </button>
            )
          })}
        </div>

        {/* Desktop - Single Row */}
        <div className="hidden md:flex space-x-4 overflow-x-auto pb-2">
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.icon_name as keyof typeof iconMap] || Square
            const iconColorClass = categoryIconColors[index % categoryIconColors.length]

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg hover:bg-muted hover:shadow-clean transition-all ios-button min-w-0 flex-shrink-0"
              >
                <div
                  className={`w-10 h-10 ${iconColorClass} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-medium block whitespace-nowrap text-foreground">{category.name_uz}</span>
                  <span className="text-xs text-muted-foreground">Kategoriya</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
