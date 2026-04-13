import { Loader2 } from 'lucide-react'

export default function AppLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )
}
