"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useTelegram } from "./TelegramContext"

interface UserProfile {
  id: string
  telegram_id?: string
  first_name: string
  last_name: string
  username?: string
  phone_number?: string
  email?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  loginWithTelegram: (telegramData: any) => Promise<UserProfile>
  loginWithPhone: (phoneNumber: string) => Promise<UserProfile>
  loginWithEmail: (email: string) => Promise<UserProfile>
  checkWebsiteLoginStatus: (token: string) => Promise<UserProfile | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: tgUser, isReady, isTelegramWebApp } = useTelegram()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isReady) {
      if (isTelegramWebApp && tgUser) {
        // Telegram Web App da avtomatik login
        handleTelegramAutoLogin()
      } else {
        // Oddiy web da session tekshirish
        checkLocalSession()
      }
    }
  }, [isReady, isTelegramWebApp, tgUser])

  const handleTelegramAutoLogin = async () => {
    if (!tgUser) {
      setLoading(false)
      return
    }

    try {
      console.log("Telegram auto login starting for user:", tgUser)

      // Telegram ID orqali foydalanuvchini qidirish
      const { data: existingUser, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", tgUser.id.toString())
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        throw searchError
      }

      let userData = existingUser

      // Agar foydalanuvchi topilmasa, yangi yaratish
      if (!existingUser) {
        console.log("Creating new user for Telegram ID:", tgUser.id)

        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              telegram_id: tgUser.id.toString(),
              first_name: tgUser.first_name,
              last_name: tgUser.last_name || "",
              username: tgUser.username || "",
              is_verified: true,
            },
          ])
          .select()
          .single()

        if (createError) throw createError
        userData = newUser
        console.log("New user created:", userData)
      } else {
        console.log("Existing user found:", existingUser)

        // Mavjud foydalanuvchi ma'lumotlarini yangilash
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            first_name: tgUser.first_name,
            last_name: tgUser.last_name || "",
            username: tgUser.username || "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id)
          .select()
          .single()

        if (updateError) throw updateError
        userData = updatedUser
      }

      setUser(userData)
      // Local storage ga saqlash
      localStorage.setItem("jamolstroy_user", JSON.stringify(userData))
      console.log("Telegram auto login successful")
    } catch (error) {
      console.error("Telegram auto login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkLocalSession = async () => {
    try {
      const savedUser = localStorage.getItem("jamolstroy_user")
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      }

      // URL dan login token tekshirish
      const urlParams = new URLSearchParams(window.location.search)
      const loginToken = urlParams.get("login_token")

      if (loginToken) {
        const loginUser = await checkWebsiteLoginStatus(loginToken)
        if (loginUser) {
          setUser(loginUser)
          localStorage.setItem("jamolstroy_user", JSON.stringify(loginUser))
          // URL dan token ni olib tashlash
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    } catch (error) {
      console.error("Local session check error:", error)
    } finally {
      setLoading(false)
    }
  }

  const loginWithTelegram = async (telegramData: any): Promise<UserProfile> => {
    try {
      // Telegram ID orqali foydalanuvchini qidirish
      const { data: existingUser, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", telegramData.telegram_id)
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        throw searchError
      }

      let userData = existingUser

      // Agar foydalanuvchi topilmasa, yangi yaratish
      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              telegram_id: telegramData.telegram_id,
              first_name: telegramData.first_name,
              last_name: telegramData.last_name,
              username: telegramData.username,
              is_verified: true,
            },
          ])
          .select()
          .single()

        if (createError) throw createError
        userData = newUser
      } else {
        // Mavjud foydalanuvchi ma'lumotlarini yangilash
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            first_name: telegramData.first_name,
            last_name: telegramData.last_name,
            username: telegramData.username,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id)
          .select()
          .single()

        if (updateError) throw updateError
        userData = updatedUser
      }

      setUser(userData)
      localStorage.setItem("jamolstroy_user", JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error("Telegram login error:", error)
      throw error
    }
  }

  const loginWithPhone = async (phoneNumber: string): Promise<UserProfile> => {
    try {
      // Telefon raqam orqali foydalanuvchini qidirish
      const { data: existingUser, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", phoneNumber)
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        throw searchError
      }

      let userData = existingUser

      // Agar foydalanuvchi topilmasa, yangi yaratish
      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              phone_number: phoneNumber,
              first_name: "Foydalanuvchi",
              last_name: "",
              is_verified: true,
            },
          ])
          .select()
          .single()

        if (createError) throw createError
        userData = newUser
      }

      setUser(userData)
      localStorage.setItem("jamolstroy_user", JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error("Phone login error:", error)
      throw error
    }
  }

  const loginWithEmail = async (email: string): Promise<UserProfile> => {
    try {
      // Email orqali foydalanuvchini qidirish
      const { data: existingUser, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        throw searchError
      }

      let userData = existingUser

      // Agar foydalanuvchi topilmasa, yangi yaratish
      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              email: email,
              first_name: "Foydalanuvchi",
              last_name: "",
              is_verified: true,
            },
          ])
          .select()
          .single()

        if (createError) throw createError
        userData = newUser
      }

      setUser(userData)
      localStorage.setItem("jamolstroy_user", JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error("Email login error:", error)
      throw error
    }
  }

  const checkWebsiteLoginStatus = async (token: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("website_login_sessions")
        .select(`
          *,
          user:users(*)
        `)
        .eq("login_token", token)
        .eq("status", "approved")
        .single()

      if (error || !data?.user) {
        return null
      }

      return data.user as UserProfile
    } catch (error) {
      console.error("Website login status check error:", error)
      return null
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("jamolstroy_user")
  }

  const value = {
    user,
    loading,
    loginWithTelegram,
    loginWithPhone,
    loginWithEmail,
    checkWebsiteLoginStatus,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
