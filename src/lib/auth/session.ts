import { createServerSupabaseClient } from '@/lib/supabase/server'

const FALLBACK_USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? '00000000-0000-4000-a000-000000000001'

// Server-only: gets real user from Supabase session, falls back to env
export async function getUserIdFromSession(): Promise<string> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.id) return user.id
  } catch {
    // Fall through
  }
  return FALLBACK_USER_ID
}
