import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStatusLabel, getStatusColor, cn } from '@/lib/utils'

export default async function MyBetsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  const userId = session.user.id

  const [createdMarkets, placedBets] = await Promise.all([
    prisma.market.findMany({
      where: { creatorId: userId },
      include: { show: true, outcomes: true, _count: { select: { bets: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bet.findMany({
      where: { bettorId: userId },
      include: {
        market: { include: { show: true, creator: { select: { name: true, venmoUsername: true } } } },
        outcome: true,
        submissions: true,
        dispute: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bets</h1>
        <p className="text-white/40 text-sm mt-1">Honor system. Don't be that person.</p>
      </div>

      {createdMarkets.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Lines I wrote</h2>
          {createdMarkets.map((market) => (
            <Link key={market.id} href={`/market/${market.id}`}>
              <div className="gradient-border p-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{market.question}</p>
                  <span className={cn('flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border', getStatusColor(market.status))}>
                    {getStatusLabel(market.status)}
                  </span>
                </div>
                <p className="text-xs text-white/30 mt-1">
                  {market.show.artist} · {market._count.bets === 0 ? 'No takers yet' : `${market._count.bets} bet`}
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}

      {placedBets.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Bets I placed</h2>
          {placedBets.map((bet) => {
            const mySubmission = bet.submissions.find((s) => s.userId === userId)
            const needsResult = ['CLOSED', 'PENDING_RESULT'].includes(bet.market.status) && !mySubmission
            return (
              <Link key={bet.id} href={`/market/${bet.market.id}`}>
                <div className={cn('gradient-border p-3 hover:bg-white/[0.02] transition-colors', needsResult && 'border-[#F59E0B]/30')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{bet.market.question}</p>
                    <span className={cn('flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border', getStatusColor(bet.market.status))}>
                      {getStatusLabel(bet.market.status)}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    My call: <span className="text-white/70 font-medium">{bet.outcome.label}</span> ({bet.outcome.odds}% odds)
                    {bet.amountDollars && ` · $${bet.amountDollars}`}
                  </p>
                  {needsResult && <p className="text-xs text-[#F59E0B] mt-1.5 font-medium">⏳ Submit your result</p>}
                  {bet.dispute && <p className="text-xs text-[#F43F5E] mt-1.5">⚠️ Disputed</p>}
                </div>
              </Link>
            )
          })}
        </section>
      )}

      {createdMarkets.length === 0 && placedBets.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🤷</p>
          <p className="text-white/60 font-medium">Nothing here yet.</p>
          <p className="text-white/30 text-sm">Write a line or call someone else's.</p>
          <Link href="/feed" className="inline-block mt-2 text-sm font-semibold text-[#7C3AED]">Back to the Board →</Link>
        </div>
      )}
    </div>
  )
}
