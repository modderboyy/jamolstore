import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./client-layout"
import { DesktopNavigation } from "@/components/layout/desktop-navigation"
import { BottomNavigation } from "@/components/layout/bottom-navigation"

export const metadata: Metadata = {
  title: "JamolStroy - Qurilish materiallari va asboblar",
  description: "Qurilish materiallari, asboblar va jihozlarni sotish va ijaraga berish",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientLayout>
      <DesktopNavigation />
      {children}
      <BottomNavigation />
    </ClientLayout>
  )
}


import './globals.css'
