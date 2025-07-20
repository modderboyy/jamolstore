"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">J</span>
          </div>
          <h1 className="text-2xl font-bold">JamolStroy</h1>
        </div>

        {/* 404 Sticker/Emoji */}
        <div className="text-8xl mb-6">😔</div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-red-600">JamolStroy dan yomon xabar</h2>
          <p className="text-lg text-muted-foreground mb-4">Bu sahifa mavjud emas</p>
          <p className="text-sm text-muted-foreground">
            Siz qidirayotgan sahifa topilmadi yoki o'chirilgan bo'lishi mumkin.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={() => router.push("/")} className="w-full" size="lg">
            <Home className="w-5 h-5 mr-2" />
            Bosh sahifaga o'tish
          </Button>

          <Button onClick={() => router.back()} variant="outline" className="w-full" size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Orqaga qaytish
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Yordam kerakmi? Bizning katalogimizdan mahsulotlarni ko'ring yoki aloqa bo'limiga murojaat qiling.
          </p>
        </div>
      </div>
    </div>
  )
}
