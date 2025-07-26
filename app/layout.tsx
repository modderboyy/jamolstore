"use client"

import type React from "react"
// 'useState' ni import qilamiz
import { useState } from "react" 
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext"
import { CartProvider } from "@/contexts/CartContext"
import { TelegramProvider } from "@/contexts/TelegramContext"

// 2. Kerakli komponentlarni import qilamiz
import { DraggableFab } from "@/components/ui/draggable-fab"
import { CartSidebar } from "@/components/CartSidebar" // <-- CartSidebar ni import qiling

const inter = Inter({ subsets: ["latin"] })

// Metadata Server Componentlarda qolishi mumkin, lekin biz butun faylni client qildik
// Bu Next.js da normal holat
// export const metadata: Metadata = { ... } // Buni vaqtincha izohga olib turamiz yoki alohida faylga chiqaramiz

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 3. Sidebar holatini boshqarish uchun state va funksiyalar
  const [isCartOpen, setIsCartOpen] = useState(false)
  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TelegramProvider>
            <AuthProvider>
              <CartProvider>
                {/* Asosiy kontent */}
                {children}

                {/* 4. CartSidebar komponentini chaqiramiz va unga holatni (isOpen) va yopish funksiyasini (onClose) beramiz. */}
                <CartSidebar isOpen={isCartOpen} onClose={closeCart} />
                
                {/* 5. DraggableFab ga bosilganda nima qilish kerakligini (onCartClick) aytamiz. */}
                <DraggableFab onCartClick={openCart} />
                
                <Toaster />
              </CartProvider>
            </AuthProvider>
          </TelegramProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
