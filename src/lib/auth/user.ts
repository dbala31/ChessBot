// Hardcoded user for v1 single-user mode.
// Replace with Supabase Auth when adding multi-user support.

export const HARDCODED_USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? 'default-user'
export const HARDCODED_USER_EMAIL = 'bala.dhruv@gmail.com'

export function getUserId(): string {
  return HARDCODED_USER_ID
}
