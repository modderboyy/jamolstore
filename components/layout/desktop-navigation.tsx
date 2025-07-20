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
  { id: "home", label: "Bosh sahifa", icon: Home, path: "/" },
  { id: "catalog", label: "Katalog", icon: Grid3X3, path: "/catalog" },
  { id: "workers", label: "Ishchilar", icon: Users, path: "/workers" },
  { id: "orders", label: "Buyurtmalar", icon: ShoppingBag, path: "/orders" },
  { id: "profile", label: "Profil", icon: User, path: "/profile" },
]

export function DesktopNavigation() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:block bg-background border-b border-border sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-8 max-w-4xl mx-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.path
            const Icon = item.icon

            return (
              <Link
                key={item.id}
                href={item.path}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  isActive
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted"
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
