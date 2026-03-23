import Link from 'next/link'
import { formatShowDate, getStatusLabel, getStatusColor, cn } from '@/lib/utils'

interface MarketCardProps {
  market: {
    id: string
    question: string
    status: string
    show: { artist: string; venue: string; city: string; date: string | Date }
    creator: { name: string | null; image: string | null; username: string | null }
    outcomes: { id: string; label: string; odds: number }[]
    _count: { bets: number }
  }
}

const OUTCOME_COLORS = [
  'bg-gradient-to-r from-[#7C3AED]/20 to-[#4F46E5]/10 border-[#7C3AED]/20 hover:border-[#7C3AED]/40',
  'bg-gradient-to-r from-[#10B981]/15 to-[#0D9488]/10 border-[#10B981]/20 hover:border-[#10B981]/40',
  'bg-gradient-to-r from-[#F59E0B]/15 to-[#F97316]/10 border-[#F59E0B]/20 hover:border-[#F59E0B]/30',
  'bg-gradient-to-r from-[#F43F5E]/15 to-[#EC4899]/10 border-[#F43F5E]/20 hover:border-[#F43F5E]/30',
]

export function MarketCard({ market }: MarketCardProps) {
  const topOutcomes = market.outcomes.slice(0, 4)

  return (
    <Link href={`/market/${market.id}`}>
      <div className="gradient-border p-4 hover:scale-[1.01] transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-xs text-white/40 mb-1 flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-white/60">{market.show.artist}</span>
              <span>·</span>
              <span>{formatShowDate(market.show.date)}</span>
              <span>·</span>
              <span className="truncate">{market.show.venue}</span>
            </div>
            <p className="text-sm font-semibold text-white leading-snug group-hover:text-white/90 transition-colors">
              {market.question}
            </p>
          </div>
          <span className={cn(
            'flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
            getStatusColor(market.status)
          )}>
            {getStatusLabel(market.status)}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          {topOutcomes.map((outcome, i) => (
            <div
              key={outcome.id}
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition-colors',
                OUTCOME_COLORS[i % OUTCOME_COLORS.length]
              )}
            >
              <span className="font-medium text-white/80">{outcome.label}</span>
              <span className="font-mono font-bold text-white">{outcome.odds}%</span>
            </div>
          ))}
          {market.outcomes.length > 4 && (
            <div className="text-xs text-white/30 px-2.5">+{market.outcomes.length - 4} more</div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-white/30">
          <span>{market.creator.name ?? market.creator.username ?? 'Anonymous'}</span>
          <span>{market._count.bets === 0 ? 'No takers yet' : market._count.bets === 1 ? '1 bet' : `${market._count.bets} bets`}</span>
        </div>
      </div>
    </Link>
  )
}
