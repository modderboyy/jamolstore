import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with custom headers for authentication
export const createSupabaseClient = (userId?: string, token?: string) => {
  const headers: Record<string, string> = {
    "x-my-custom-header": "jamolstroy-web",
  }

  // Add user ID to headers if provided
  if (userId) {
    headers["x-user-id"] = userId
  }

  // Add authorization token if provided
  if (token) {
    headers["authorization"] = `Bearer ${token}`
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers,
    },
  })
}

// Default client (no authentication)
export const supabase = createSupabaseClient()

// Server-side client
export const createServerClient = (userId?: string, token?: string) => {
  return createSupabaseClient(userId, token)
}

// Admin client for sensitive operations
export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: "public",
    },
  })
}
