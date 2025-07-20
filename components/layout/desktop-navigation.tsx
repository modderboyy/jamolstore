"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Grid3X3, Users, User, ShoppingBag } from "lucide-react"

interface DesktopNavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}

const navigationItems: DesktopNavItem[] = [
  { id: "home", label: "Bosh sahifa", icon: Home, path: "/" },
  { id: "catalog", label: "Katalog", icon: Grid3X3, path: "/catalog" },
  { id: "workers", label: "Ishchilar", icon: Users, path: "/workers" },
  { id: "orders", label: "Buyurtmalar", icon: ShoppingBag, path: "/orders" },
  { id: "profile", label: "Profil", icon: User, path: "/profile" },
]

export function DesktopNavigation() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:block bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-8">
          {navigationItems.map((item) => {
            const isActive = pathname === item.path
            const Icon = item.icon

            return (
              <Link
                key={item.id}
                href={item.path}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors hover:bg-muted/50 ${
                  isActive
                    ? "text-primary bg-primary/10 border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
