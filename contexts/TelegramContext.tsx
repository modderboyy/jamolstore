"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface TelegramContextType {
  webApp: any
  user: TelegramUser | null
  isReady: boolean
  isTelegramWebApp: boolean
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined)

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<any>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false)

  useEffect(() => {
    const initTelegram = () => {
      try {
        // Check if we're in Telegram WebApp environment
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp
          console.log("Telegram WebApp detected:", tg)

          setWebApp(tg)
          setIsTelegramWebApp(true)

          // Initialize WebApp
          tg.ready()
          tg.expand()

          // Set theme
          if (tg.colorScheme === "dark") {
            document.documentElement.classList.add("dark")
          } else {
            document.documentElement.classList.remove("dark")
          }

          // Get user data
          if (tg.initDataUnsafe?.user) {
            console.log("Telegram user data:", tg.initDataUnsafe.user)
            setUser(tg.initDataUnsafe.user)
          }

          setIsReady(true)
        } else {
          console.log("Not in Telegram WebApp environment")
          setIsTelegramWebApp(false)
          setIsReady(true)
        }
      } catch (error) {
        console.error("Telegram initialization error:", error)
        setIsTelegramWebApp(false)
        setIsReady(true)
      }
    }

    // Check if Telegram script is already loaded
    if (typeof window !== "undefined") {
      if (window.Telegram?.WebApp) {
        initTelegram()
      } else {
        // Wait for Telegram script to load
        const checkTelegram = setInterval(() => {
          if (window.Telegram?.WebApp) {
            clearInterval(checkTelegram)
            initTelegram()
          }
        }, 100)

        // Fallback timeout
        setTimeout(() => {
          clearInterval(checkTelegram)
          if (!webApp) {
            console.log("Telegram WebApp not available, continuing without it")
            setIsTelegramWebApp(false)
            setIsReady(true)
          }
        }, 3000)

        return () => clearInterval(checkTelegram)
      }
    }
  }, [])

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        isReady,
        isTelegramWebApp,
      }}
    >
      {children}
    </TelegramContext.Provider>
  )
}

export function useTelegram() {
  const context = useContext(TelegramContext)
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider")
  }
  return context
}
