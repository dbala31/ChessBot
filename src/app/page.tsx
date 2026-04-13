import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

export default async function Home() {
  // Check if any user has completed onboarding
  // For v1 (single-user), just check if user_settings exists with onboarding_complete=true
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('user_settings')
      .select('onboarding_complete')
      .eq('onboarding_complete', true)
      .limit(1)
      .single()

    if (data) {
      redirect('/dashboard')
    }
  } catch {
    // No settings row or DB error — go to onboarding
  }

  redirect('/onboarding')
}
