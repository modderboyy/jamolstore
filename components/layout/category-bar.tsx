"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface Category {
  id: string
  name_uz: string
  icon_name: string
  sort_order: number
}

export function CategoryBar() {
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
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order")
        .limit(10)

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Kategoriyalarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-2 md:py-3">
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-20 h-8 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-2 md:py-3">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.id}`}
              className="flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium whitespace-nowrap">{category.name_uz}</span>
            </Link>
          ))}

          <Link
            href="/catalog-list"
            className="flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 bg-primary text-primary-foreground rounded-lg transition-colors flex items-center space-x-1"
          >
            <span className="text-sm font-medium whitespace-nowrap">Barchasi</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
