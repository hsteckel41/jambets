import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { UsernameSetupModal } from '@/components/username-setup-modal'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/signin')

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {!session.user.username && <UsernameSetupModal />}

      <header className="sticky top-0 z-50 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center">
          <span className="font-serif italic text-xl tracking-tight">
            <span className="text-[#7C3AED]">Jam</span>
            <span className="text-[#F5F0E8]">Bets</span>
          </span>
        </Link>
        <Link
          href="/market/new"
          className="text-xs font-bold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #10B981 100%)' }}
        >
          Drop a Bet
        </Link>
      </header>

      <main className="flex-1 px-4 py-4">
        {children}
      </main>

      <BottomNav username={session.user.username ?? null} />
    </div>
  )
}
