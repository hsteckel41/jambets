import Link from 'next/link'
import { formatShowDate, cn, getMarketCardGradient } from '@/lib/utils'

interface MarketCardProps {
  market: {
    id: string
    question: string
    status: string
    amountDollars?: number | null
    show: { artist: string; venue: string; city: string; date: string | Date }
    creator: {
      name: string | null
      image: string | null
      username: string | null
      ratingsReceived?: { stars: number }[]
    }
    outcomes: { id: string; label: string; odds: number; isCreatorPick: boolean }[]
    _count: { bets: number }
  }
}


function StatusPill({ status }: { status: string }) {
  if (status === 'OPEN') {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#10B981] text-[#0C0A07]">
        Open
      </span>
    )
  }
  if (status === 'PENDING_RESULT') {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-400/40 text-amber-400/90">
        Truth Time
      </span>
    )
  }
  if (status === 'SETTLED') {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#10B981]/30 text-[#10B981]/70">
        Settled
      </span>
    )
  }
  if (status === 'VOIDED') {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10 text-white/25">
        Voided
      </span>
    )
  }
  // CLOSED / TAKEN / anything else
  return (
    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/15 text-white/40">
      Taken
    </span>
  )
}

function LightningRating({ ratings }: { ratings?: { stars: number }[] }) {
  if (!ratings || ratings.length === 0) return null
  const avg = ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
  const rounded = Math.round(avg * 2) / 2 // nearest 0.5
  const full = Math.floor(rounded)
  const hasHalf = rounded % 1 !== 0
  const empty = 5 - full - (hasHalf ? 1 : 0)

  return (
    <span className="flex items-center gap-0.5" title={`${avg.toFixed(1)} / 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} className="text-[11px]">⚡</span>
      ))}
      {hasHalf && <span className="text-[11px] opacity-50">⚡</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} className="text-[11px] opacity-20">⚡</span>
      ))}
    </span>
  )
}

export function MarketCard({ market }: MarketCardProps) {
  const isOpen = market.status === 'OPEN'
  const creatorOutcome = market.outcomes.find((o) => o.isCreatorPick)
  const bettorOutcome = market.outcomes.find((o) => !o.isCreatorPick)
  const creatorName = market.creator.username ?? market.creator.name ?? 'anon'

  return (
    <Link href={`/market/${market.id}`}>
      <div
        className="rounded-2xl border border-white/[0.08] p-4 space-y-3 hover:border-white/[0.14] transition-all duration-200 cursor-pointer group"
        style={{ background: `${getMarketCardGradient(market.id)}, rgba(255,255,255,0.025)` }}
      >
        {/* Row 1: Show info + status pill */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-sm font-bold text-white group-hover:text-white/90 transition-colors">
              {market.show.artist}
            </span>
            <span className="text-xs text-white/35 ml-1.5">
              {market.show.venue} · {formatShowDate(market.show.date)}
            </span>
          </div>
          <StatusPill status={market.status} />
        </div>

        {/* Row 2: The bet question */}
        <p className="text-[15px] font-semibold text-white leading-snug">
          {market.question}
        </p>

        {/* Row 3: The two sides */}
        <div className="grid grid-cols-2 gap-2">
          {/* Caller's side */}
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-2.5">
            <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-1">
              Caller&rsquo;s Call
            </div>
            <div className="text-xs font-medium text-white/75 leading-snug line-clamp-2">
              {creatorOutcome?.label ?? '—'}
            </div>
            <div className="text-[11px] font-mono text-white/35 mt-1">
              {creatorOutcome?.odds ?? 0}%
            </div>
          </div>

          {/* Taker's side */}
          <div className={cn(
            'rounded-xl p-2.5 border transition-colors',
            isOpen
              ? 'bg-[#10B981]/10 border-[#10B981]/25'
              : 'bg-white/[0.04] border-white/[0.07]'
          )}>
            <div className={cn(
              'text-[9px] uppercase tracking-widest font-bold mb-1',
              isOpen ? 'text-[#10B981]/60' : 'text-white/30'
            )}>
              {isOpen ? "You'd Take" : "Taker's Side"}
            </div>
            <div className="text-xs font-medium text-white/75 leading-snug line-clamp-2">
              {bettorOutcome?.label ?? '—'}
            </div>
            <div className="text-[11px] font-mono text-white/35 mt-1">
              {bettorOutcome?.odds ?? 0}%
            </div>
          </div>
        </div>

        {/* Row 4: Footer — creator, rating, risk/win amounts, CTA */}
        <div className="space-y-2 pt-0.5">
          {/* Win/lose amounts when there's a stake */}
          {market.amountDollars && creatorOutcome && bettorOutcome && (
            (() => {
              const creatorStake = Number(market.amountDollars)
              const takerStake = creatorOutcome.odds > 0
                ? creatorStake * (bettorOutcome.odds / creatorOutcome.odds)
                : creatorStake
              return (
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-white/30">
                    Caller risks <span className="text-white/55">${creatorStake.toFixed(0)}</span>
                    {' · '}wins <span className="text-[#10B981]/70">${takerStake.toFixed(0)}</span>
                  </span>
                  {isOpen && (
                    <span className="text-white/20 mx-0.5">|</span>
                  )}
                  {isOpen && (
                    <span className="text-white/30">
                      Taker risks <span className="text-white/55">${takerStake.toFixed(0)}</span>
                      {' · '}wins <span className="text-[#10B981]/70">${creatorStake.toFixed(0)}</span>
                    </span>
                  )}
                </div>
              )
            })()
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/35">
              <span>@{creatorName}</span>
              <LightningRating ratings={market.creator.ratingsReceived} />
            </div>
            {isOpen && (
              <span className="text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25 px-2.5 py-1 rounded-full">
                Take It →
              </span>
            )}
            {!isOpen && market._count.bets > 0 && (
              <span className="text-[11px] text-white/25">Locked in</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
