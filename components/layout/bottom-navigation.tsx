"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, Package, Users, User } from "lucide-react"

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      name: "Bosh sahifa",
      href: "/",
      icon: Home,
      active: pathname === "/",
    },
    {
      name: "Katalog",
      href: "/catalog",
      icon: Package,
      active: pathname === "/catalog" || pathname === "/catalog-list",
    },
    {
      name: "Ishchilar",
      href: "/workers",
      icon: Users,
      active: pathname === "/workers",
    },
    {
      name: "Profil",
      href: "/profile",
      icon: User,
      active: pathname === "/profile" || pathname.startsWith("/profile/"),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-30">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                item.active
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
