"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useTelegram } from "./TelegramContext"

interface User {
  id: string
  telegram_id?: string
  first_name: string
  last_name?: string
  username?: string
  phone?: string
  email?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { webApp, user: tgUser, isReady } = useTelegram()

  useEffect(() => {
    if (isReady) {
      checkAuth()
    }
  }, [isReady, tgUser])

  const checkAuth = async () => {
    try {
      setLoading(true)

      // Check if we're in Telegram WebApp
      if (webApp && tgUser) {
        console.log("Telegram WebApp user found:", tgUser)
        await handleTelegramAuth(tgUser)
      } else {
        console.log("Not in Telegram WebApp environment")
        // Check for web session
        await checkWebSession()
      }
    } catch (error) {
      console.error("Auth check error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramAuth = async (tgUser: any) => {
    try {
      // Check if user exists in database
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", tgUser.id.toString())
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      if (existingUser) {
        console.log("Existing Telegram user found:", existingUser)
        setUser(existingUser)
      } else {
        // Create new user
        const newUser = {
          telegram_id: tgUser.id.toString(),
          first_name: tgUser.first_name || "Telegram User",
          last_name: tgUser.last_name || "",
          username: tgUser.username || null,
        }

        const { data: createdUser, error: createError } = await supabase.from("users").insert(newUser).select().single()

        if (createError) throw createError

        console.log("New Telegram user created:", createdUser)
        setUser(createdUser)
      }
    } catch (error) {
      console.error("Telegram auth error:", error)
    }
  }

  const checkWebSession = async () => {
    try {
      console.log("Checking web session...")
      const sessionData = localStorage.getItem("user_session")

      if (sessionData) {
        const session = JSON.parse(sessionData)
        console.log("Local session found for:", session.first_name)

        // Verify session is still valid
        const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.id).single()

        if (error) {
          console.log("Session invalid, clearing...")
          localStorage.removeItem("user_session")
          setUser(null)
        } else {
          console.log("Session valid, user authenticated")
          setUser(userData)
        }
      } else {
        console.log("No local session found")
        setUser(null)
      }
    } catch (error) {
      console.error("Web session check error:", error)
      localStorage.removeItem("user_session")
      setUser(null)
    }
  }

  const refreshUser = async () => {
    if (user) {
      try {
        const { data: userData, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) throw error
        setUser(userData)
      } catch (error) {
        console.error("Error refreshing user:", error)
      }
    }
  }

  const signOut = async () => {
    try {
      setUser(null)
      localStorage.removeItem("user_session")

      // Clear any website login sessions
      if (user) {
        await supabase.from("website_login_sessions").delete().eq("user_id", user.id)
      }

      console.log("User signed out successfully")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
