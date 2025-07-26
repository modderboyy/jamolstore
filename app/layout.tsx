import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext"
import { CartProvider } from "@/contexts/CartContext"
import { TelegramProvider } from "@/contexts/TelegramContext"
import { DraggableFab } from "@/components/ui/draggable-fab"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JamolStroy - Qurilish materiallari",
  description: "Qurilish materiallari va jihozlari onlayn do'koni",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TelegramProvider>
            <AuthProvider>
              <CartProvider>
                {children}
                <Toaster />
              </CartProvider>
            </AuthProvider>
          </TelegramProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
