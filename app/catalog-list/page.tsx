"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, ChevronRight, Package, Folder } from "lucide-react"

interface Category {
  id: string
  name_uz: string
  parent_id: string | null
  icon_name: string
  sort_order: number
  product_count?: number
  subcategories?: Category[]
}

interface Product {
  id: string
  name_uz: string
  price: number
  unit: string
  images: string[]
  category_id: string
}

export default function CatalogListPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategoriesWithHierarchy()
  }, [])

  const fetchCategoriesWithHierarchy = async () => {
    try {
      // Barcha kategoriyalarni olish
      const { data: allCategories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")

      if (categoriesError) throw categoriesError

      // Har bir kategoriya uchun mahsulotlar sonini hisoblash
      const categoriesWithCounts = await Promise.all(
        (allCategories || []).map(async (category) => {
          const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("is_available", true)

          return {
            ...category,
            product_count: count || 0,
          }
        }),
      )

      // Ierarxik tuzilma yaratish
      const buildHierarchy = (parentId: string | null = null): Category[] => {
        return categoriesWithCounts
          .filter((cat) => cat.parent_id === parentId)
          .map((cat) => ({
            ...cat,
            subcategories: buildHierarchy(cat.id),
          }))
      }

      const hierarchicalCategories = buildHierarchy()
      setCategories(hierarchicalCategories)
    } catch (error) {
      console.error("Kategoriyalarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderCategory = (category: Category, level = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0
    const hasProducts = category.product_count && category.product_count > 0

    return (
      <div key={category.id} className="space-y-2">
        {/* Category Item */}
        <div
          className={`flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:shadow-sm transition-all cursor-pointer ${
            level > 0 ? "ml-" + (level * 4) : ""
          }`}
          onClick={() => {
            if (hasProducts) {
              router.push(`/catalog?category=${category.id}`)
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                level === 0 ? "bg-primary/10" : level === 1 ? "bg-secondary/10" : "bg-muted"
              }`}
            >
              {hasSubcategories ? (
                <Folder
                  className={`w-5 h-5 ${
                    level === 0 ? "text-primary" : level === 1 ? "text-secondary-foreground" : "text-muted-foreground"
                  }`}
                />
              ) : (
                <Package
                  className={`w-5 h-5 ${
                    level === 0 ? "text-primary" : level === 1 ? "text-secondary-foreground" : "text-muted-foreground"
                  }`}
                />
              )}
            </div>
            <div>
              <h3 className={`font-medium ${level === 0 ? "text-lg" : level === 1 ? "text-base" : "text-sm"}`}>
                {category.name_uz}
              </h3>
              <p className="text-sm text-muted-foreground">
                {hasProducts && `${category.product_count} ta mahsulot`}
                {hasSubcategories && !hasProducts && `${category.subcategories!.length} ta bo'lim`}
                {hasSubcategories && hasProducts && ` • ${category.subcategories!.length} ta bo'lim`}
              </p>
            </div>
          </div>
          {(hasProducts || hasSubcategories) && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
        </div>

        {/* Subcategories */}
        {hasSubcategories && (
          <div className="space-y-2">
            {category.subcategories!.map((subcategory) => renderCategory(subcategory, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Katalog ro'yxati</h1>
            <p className="text-sm text-muted-foreground">Barcha kategoriyalar va mahsulotlar</p>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">{categories.map((category) => renderCategory(category))}</div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Kategoriyalar topilmadi</h3>
            <p className="text-muted-foreground">Hozircha kategoriyalar mavjud emas</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
