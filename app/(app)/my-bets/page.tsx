import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, getMarketCardGradient } from '@/lib/utils'

function StatusPill({ status }: { status: string }) {
  if (status === 'OPEN') {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[#10B981] text-[#0C0A07]">
        Open
      </span>
    )
  }
  if (status === 'PENDING_RESULT') {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-amber-400/40 text-amber-400/90">
        Truth Time
      </span>
    )
  }
  if (status === 'SETTLED') {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-[#10B981]/30 text-[#10B981]/70">
        Settled
      </span>
    )
  }
  if (status === 'DISPUTED') {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-[#F43F5E]/30 text-[#F43F5E]/80">
        Disputed
      </span>
    )
  }
  if (status === 'VOIDED') {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-white/10 text-white/25">
        Voided
      </span>
    )
  }
  return (
    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-white/15 text-white/40">
      Taken
    </span>
  )
}

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
        <p className="text-white/40 text-sm mt-1">Honor system. Don&rsquo;t be that person.</p>
      </div>

      {createdMarkets.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Bets I created</h2>
          <div className="flex flex-col" style={{ gap: '8px' }}>
            {createdMarkets.map((market) => (
              <Link key={market.id} href={`/market/${market.id}`}>
                <div
                  className="rounded-2xl border border-white/[0.08] p-4 hover:border-white/[0.14] transition-all"
                  style={{ background: `${getMarketCardGradient(market.id)}, rgba(255,255,255,0.025)` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{market.question}</p>
                    <StatusPill status={market.status} />
                  </div>
                  <p className="text-xs text-white/30 mt-2">
                    {market.show.artist}
                    {market._count.bets === 0 ? ' · No takers yet' : ' · Locked in'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {placedBets.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Bets I took</h2>
          <div className="flex flex-col" style={{ gap: '8px' }}>
          {placedBets.map((bet) => {
            const mySubmission = bet.submissions.find((s) => s.userId === userId)
            const needsResult =
              ['CLOSED', 'PENDING_RESULT'].includes(bet.market.status) && !mySubmission
            return (
              <Link key={bet.id} href={`/market/${bet.market.id}`}>
                <div
                  className={cn(
                    'rounded-2xl border border-white/[0.08] p-4 hover:border-white/[0.14] transition-all',
                    needsResult && 'border-amber-400/20'
                  )}
                  style={{ background: `${getMarketCardGradient(bet.market.id)}, rgba(255,255,255,0.025)` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{bet.market.question}</p>
                    <StatusPill status={bet.market.status} />
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    {bet.market.show.artist} ·{' '}
                    <span className="text-white/60 font-medium">{bet.outcome.label}</span>{' '}
                    <span className="text-white/30">({bet.outcome.odds}%)</span>
                    {bet.amountDollars && (
                      <span className="text-[#10B981]/60 font-mono ml-1">
                        ${Number(bet.amountDollars).toFixed(0)}
                      </span>
                    )}
                  </p>
                  {needsResult && (
                    <p className="text-xs text-amber-400 mt-2 font-medium">⏳ Submit your result</p>
                  )}
                  {bet.dispute && (
                    <p className="text-xs text-[#F43F5E] mt-2">⚠️ Disputed — tap to resolve</p>
                  )}
                </div>
              </Link>
            )
          })}
          </div>
        </section>
      )}

      {createdMarkets.length === 0 && placedBets.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🤷</p>
          <p className="text-white/60 font-medium">Nothing here yet.</p>
          <p className="text-white/30 text-sm">Drop a bet or take someone else&rsquo;s line.</p>
          <Link href="/feed" className="inline-block mt-2 text-sm font-semibold text-[#7C3AED]">
            Back to the Board →
          </Link>
        </div>
      )}
    </div>
  )
}
