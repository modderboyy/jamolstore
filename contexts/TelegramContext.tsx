"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    chat_instance?: string
    chat_type?: string
    start_param?: string
  }
  version: string
  platform: string
  colorScheme: "light" | "dark"
  themeParams: {
    link_color: string
    button_color: string
    button_text_color: string
    secondary_bg_color: string
    hint_color: string
    bg_color: string
    text_color: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  BackButton: {
    isVisible: boolean
    show(): void
    hide(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText(text: string): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
    setParams(params: {
      text?: string
      color?: string
      text_color?: string
      is_active?: boolean
      is_visible?: boolean
    }): void
  }
  HapticFeedback: {
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void
    notificationOccurred(type: "error" | "success" | "warning"): void
    selectionChanged(): void
  }
  showAlert(message: string): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  showPopup(
    params: {
      title?: string
      message: string
      buttons?: Array<{
        id?: string
        type?: "default" | "ok" | "close" | "cancel" | "destructive"
        text: string
      }>
    },
    callback?: (buttonId: string) => void,
  ): void
  ready(): void
  expand(): void
  close(): void
}

interface TelegramContextType {
  webApp: TelegramWebApp | null
  user: TelegramUser | null
  isReady: boolean
  isTelegramWebApp: boolean
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined)

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false)

  useEffect(() => {
    const initTelegram = () => {
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        console.log("Telegram WebApp found:", tg)

        setWebApp(tg)
        setIsTelegramWebApp(true)

        // Get user data from Telegram
        if (tg.initDataUnsafe?.user) {
          console.log("Telegram user found:", tg.initDataUnsafe.user)
          setUser(tg.initDataUnsafe.user)
        }

        // Configure WebApp
        tg.ready()
        tg.expand()

        // Set theme
        if (tg.colorScheme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }

        // Hide buttons
        tg.MainButton.hide()
        tg.BackButton.hide()

        console.log("Telegram WebApp initialized successfully")
      } else {
        console.log("Not in Telegram WebApp environment")
        setIsTelegramWebApp(false)
      }
      setIsReady(true)
    }

    // Check if Telegram WebApp script is loaded
    if (typeof window !== "undefined") {
      if (window.Telegram?.WebApp) {
        initTelegram()
      } else {
        // Wait for Telegram WebApp script to load
        const checkTelegram = setInterval(() => {
          if (window.Telegram?.WebApp) {
            clearInterval(checkTelegram)
            initTelegram()
          }
        }, 100)

        // Fallback timeout
        setTimeout(() => {
          clearInterval(checkTelegram)
          if (!window.Telegram?.WebApp) {
            console.log("Telegram WebApp not found after timeout")
            setIsReady(true)
            setIsTelegramWebApp(false)
          }
        }, 3000)
      }
    }
  }, [])

  const value = {
    webApp,
    user,
    isReady,
    isTelegramWebApp,
  }

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
}

export function useTelegram() {
  const context = useContext(TelegramContext)
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider")
  }
  return context
}
