"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface TelegramWebApp {
  initData: string
  initDataUnsafe: any
  version: string
  platform: string
  colorScheme: "light" | "dark"
  themeParams: any
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  isClosingConfirmationEnabled: boolean
  ready(): void
  expand(): void
  close(): void
  sendData(data: string): void
  showPopup(params: any): void
  showAlert(message: string): void
  showConfirm(message: string): void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText(text: string): void
    onClick(callback: () => void): void
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
  }
  BackButton: {
    isVisible: boolean
    onClick(callback: () => void): void
    show(): void
    hide(): void
  }
}

interface TelegramUser {
  id: number
  is_bot?: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

interface TelegramContextType {
  webApp: TelegramWebApp | null
  user: TelegramUser | null
  isReady: boolean
  isTelegramWebApp: boolean
  initData: string | null
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined)

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false)
  const [initData, setInitData] = useState<string | null>(null)

  useEffect(() => {
    const initTelegram = () => {
      if (typeof window !== "undefined") {
        // Telegram Web App mavjudligini tekshirish
        const tg = (window as any).Telegram?.WebApp

        if (tg) {
          console.log("Telegram Web App detected:", tg)
          setWebApp(tg)
          setIsTelegramWebApp(true)
          setInitData(tg.initData)

          // User ma'lumotlarini olish
          if (tg.initDataUnsafe?.user) {
            console.log("Telegram user:", tg.initDataUnsafe.user)
            setUser(tg.initDataUnsafe.user)
          }

          // Web App ni sozlash
          tg.ready()
          tg.expand()

          // Theme ni sozlash
          if (tg.colorScheme === "dark") {
            document.documentElement.classList.add("dark")
          } else {
            document.documentElement.classList.remove("dark")
          }

          // Main button ni yashirish
          tg.MainButton.hide()
          tg.BackButton.hide()

          setIsReady(true)
        } else {
          console.log("Not in Telegram Web App")
          setIsTelegramWebApp(false)
          setIsReady(true)
        }
      }
    }

    // Telegram script yuklanishini kutish
    if (typeof window !== "undefined") {
      if ((window as any).Telegram?.WebApp) {
        initTelegram()
      } else {
        // Script yuklanishini kutish
        const checkTelegram = setInterval(() => {
          if ((window as any).Telegram?.WebApp) {
            clearInterval(checkTelegram)
            initTelegram()
          }
        }, 100)

        // 5 soniyadan keyin to'xtatish
        setTimeout(() => {
          clearInterval(checkTelegram)
          if (!webApp) {
            console.log("Telegram Web App not found after timeout")
            setIsTelegramWebApp(false)
            setIsReady(true)
          }
        }, 5000)
      }
    }
  }, [])

  return (
    <TelegramContext.Provider value={{ webApp, user, isReady, isTelegramWebApp, initData }}>
      {children}
    </TelegramContext.Provider>
  )
}

export const useTelegram = () => {
  const context = useContext(TelegramContext)
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider")
  }
  return context
}
