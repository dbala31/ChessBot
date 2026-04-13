// Sync fallback for client-side code
export const FALLBACK_USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? '00000000-0000-4000-a000-000000000001'

export function getUserId(): string {
  return FALLBACK_USER_ID
}
