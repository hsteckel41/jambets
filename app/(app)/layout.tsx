import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/signin')

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      <header className="sticky top-0 z-50 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2">
          <span className="text-lg">🎸</span>
          <span className="font-bold text-base tracking-tight">JamBets</span>
        </Link>
        <Link
          href="/market/new"
          className="text-xs font-semibold bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/30 text-[#7C3AED] px-3 py-1.5 rounded-full transition-colors"
        >
          Write a Line
        </Link>
      </header>

      <main className="flex-1 px-4 py-4">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
