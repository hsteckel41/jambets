import Link from 'next/link'
import { formatShowDate, getMarketCardGradient } from '@/lib/utils'

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

function LightningRating({ ratings }: { ratings?: { stars: number }[] }) {
  if (!ratings || ratings.length === 0) return null
  const avg = ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
  const full = Math.round(avg)
  return (
    <span className="flex items-center gap-0.5" title={`${avg.toFixed(1)} / 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={i} className="text-[11px]">⚡</span>
      ))}
      {Array.from({ length: 5 - full }).map((_, i) => (
        <span key={i} className="text-[11px] opacity-20">⚡</span>
      ))}
    </span>
  )
}

export function MarketCard({ market }: MarketCardProps) {
  const isOpen = market.status === 'OPEN'
  const creatorOutcome = market.outcomes.find((o) => o.isCreatorPick)
  const bettorOutcome = market.outcomes.find((o) => !o.isCreatorPick)
  const creatorName = market.creator.username ?? market.creator.name ?? 'anon'

  const creatorStake = market.amountDollars ? Number(market.amountDollars) : null
  const takerStake =
    creatorStake && creatorOutcome && bettorOutcome && creatorOutcome.odds > 0
      ? creatorStake * (bettorOutcome.odds / creatorOutcome.odds)
      : null

  return (
    <Link href={`/market/${market.id}`} className="block">
      <div
        className="rounded-2xl border border-white/[0.08] overflow-hidden active:scale-[0.985] transition-transform duration-100 cursor-pointer"
        style={{ background: `${getMarketCardGradient(market.id)}, rgba(255,255,255,0.025)` }}
      >
        {/* Top strip: show info + status */}
        <div className="px-4 pt-3.5 pb-0 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-bold text-white/80">{market.show.artist}</span>
            <span className="text-[11px] text-white/30 ml-1.5">
              {market.show.venue} · {formatShowDate(market.show.date)}
            </span>
          </div>
          {isOpen ? (
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#10B981] text-[#0C0A07]">
              Open
            </span>
          ) : (
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/15 text-white/35">
              {market.status === 'SETTLED' ? 'Settled' : market.status === 'PENDING_RESULT' ? 'Truth Time' : 'Taken'}
            </span>
          )}
        </div>

        {/* Question */}
        <div className="px-4 pt-2.5 pb-3">
          <p className="text-[15px] font-semibold text-white leading-snug">{market.question}</p>
        </div>

        {/* Sportsbook-style outcome tile — taker's side */}
        {bettorOutcome && creatorOutcome && (
          <div className="px-4 pb-3">
            <div
              className={`rounded-xl px-4 py-3 flex items-center justify-between border transition-colors ${
                isOpen
                  ? 'bg-[#10B981]/10 border-[#10B981]/30'
                  : 'bg-white/[0.04] border-white/[0.07]'
              }`}
            >
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${isOpen ? 'text-[#10B981]/60' : 'text-white/25'}`}>
                  {isOpen ? "You'd take" : "Taker's side"}
                </p>
                <p className="text-sm font-bold text-white leading-snug">{bettorOutcome.label}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className={`text-lg font-black font-mono tabular-nums ${isOpen ? 'text-[#10B981]' : 'text-white/40'}`}>
                  {bettorOutcome.odds}%
                </p>
                {takerStake !== null && creatorStake !== null && (
                  <p className="text-[10px] text-white/30 font-mono">
                    risk ${takerStake.toFixed(0)} · win ${creatorStake.toFixed(0)}
                  </p>
                )}
              </div>
            </div>

            {/* Caller's position — secondary, small */}
            <p className="text-[10px] text-white/25 mt-1.5 px-1">
              Caller says: <span className="text-white/40">{creatorOutcome.label}</span>
              <span className="ml-1 text-white/20">({creatorOutcome.odds}%)</span>
            </p>
          </div>
        )}

        {/* Footer / CTA */}
        <div className="px-4 pb-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span>@{creatorName}</span>
            <LightningRating ratings={market.creator.ratingsReceived} />
          </div>

          {isOpen ? (
            <button
              className="flex-shrink-0 text-xs font-bold text-white px-4 py-2 rounded-xl transition-opacity hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #10B981)' }}
              tabIndex={-1}
            >
              Take This Bet →
            </button>
          ) : (
            market._count.bets > 0 && (
              <span className="text-[11px] text-white/20">Locked in</span>
            )
          )}
        </div>
      </div>
    </Link>
  )
}
