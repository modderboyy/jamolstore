"use client"

import { useRouter } from "next/navigation"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-md mx-auto">
          {/* Sad Emoji Sticker */}
          <div className="text-8xl mb-6">😢</div>

          {/* JamolStroy Branding */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">J</span>
              </div>
              <span className="font-bold text-xl">JamolStroy</span>
            </div>
            <p className="text-muted-foreground text-sm">dan yomon xabar</p>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold mb-4">Bu sahifa mavjud emas</h1>
          <p className="text-muted-foreground mb-8">
            Kechirasiz, siz qidirayotgan sahifa topilmadi yoki o'chirilgan bo'lishi mumkin.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={() => router.push("/")} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Bosh sahifaga o'tish
            </Button>

            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Orqaga qaytish
            </Button>
          </div>

          {/* Additional Help */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Agar muammo davom etsa, bizning{" "}
              <button onClick={() => router.push("/catalog")} className="text-primary hover:underline">
                katalog
              </button>{" "}
              bo'limiga tashrif buyuring yoki{" "}
              <a href="tel:+998901234567" className="text-primary hover:underline">
                +998 90 123 45 67
              </a>{" "}
              raqamiga qo'ng'iroq qiling.
            </p>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
