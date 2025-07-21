"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Category } from "@/types"

interface CategoryBarProps {
  categories: Category[]
}

/**
 * Category list shown below the top-bar.
 * – Mobile height reduced (py-1 instead of larger padding).
 * – Keeps previous desktop styling intact.
 */
export function CategoryBar({ categories }: CategoryBarProps) {
  const pathname = usePathname()

  return (
    <div className="bg-background border-b border-border py-2 md:py-3 sticky top-[73px] md:top-[120px] z-20">
      <div className="container mx-auto px-4">
        <div className="flex space-x-2 md:space-x-4 overflow-x-auto scrollbar-hide py-1">
          {categories.map((category) => {
            const isActive = pathname === `/category/${category.slug}`

            return (
              <Link href={`/category/${category.slug}`} key={category.id}>
                <div
                  className={`flex-shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {category.name}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
