"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Grid3X3, Users, User, ShoppingBag } from "lucide-react"

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}

const navigationItems: NavItem[] = [
  { id: "home", label: "Bosh", icon: Home, path: "/" },
  { id: "catalog", label: "Katalog", icon: Grid3X3, path: "/catalog" },
  { id: "workers", label: "Ishchilar", icon: Users, path: "/workers" },
  { id: "orders", label: "Buyurtma", icon: ShoppingBag, path: "/orders" },
  { id: "profile", label: "Profil", icon: User, path: "/profile" },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-40">
      <div className="flex items-center justify-around py-2 pb-safe">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
