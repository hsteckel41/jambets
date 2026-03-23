import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStatusLabel, getStatusColor, cn } from '@/lib/utils'
import { MarketActionPanel } from '@/components/market-action-panel'

export default async function MarketPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const userId = session?.user?.id

  const market = await prisma.market.findUnique({
    where: { id: params.id },
    include: {
      show: true,
      creator: { select: { id: true, name: true, image: true, username: true, venmoUsername: true } },
      outcomes: { orderBy: { odds: 'desc' } },
      bets: {
        include: {
          bettor: { select: { id: true, name: true, image: true } },
          outcome: true,
          submissions: true,
          dispute: true,
        },
      },
    },
  })

  if (!market) notFound()

  const userBet = market.bets.find((b) => b.bettorId === userId)
  const isCreator = market.creatorId === userId
  const mySubmission = userBet?.submissions.find((s) => s.userId === userId)
  const otherSubmission = userBet?.submissions.find((s) => s.userId !== userId)

  const OUTCOME_COLORS = [
    'bg-gradient-to-r from-[#7C3AED]/20 to-[#4F46E5]/10',
    'bg-gradient-to-r from-[#10B981]/15 to-[#0D9488]/10',
    'bg-gradient-to-r from-[#F59E0B]/15 to-[#F97316]/10',
    'bg-gradient-to-r from-[#F43F5E]/15 to-[#EC4899]/10',
  ]

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/40">{market.show.artist} · {market.show.venue}</p>
          <h1 className="text-xl font-bold mt-1 leading-snug">{market.question}</h1>
        </div>
        <span className={cn('flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border mt-1', getStatusColor(market.status))}>
          {getStatusLabel(market.status)}
        </span>
      </div>

      <p className="text-sm text-white/40">Line by <span className="text-white/70 font-medium">{market.creator.name}</span></p>

      <div className="gradient-border p-4 space-y-2">
        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">The Odds</p>
        {market.outcomes.map((outcome, i) => {
          const isMyPick = userBet?.outcomeId === outcome.id
          return (
            <div
              key={outcome.id}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors',
                OUTCOME_COLORS[i % OUTCOME_COLORS.length],
                isMyPick ? 'border-white/20' : 'border-white/[0.06]'
              )}
            >
              <div className="flex items-center gap-2">
                {isMyPick && <span className="text-[10px] text-[#7C3AED] font-bold">MY CALL</span>}
                <span className="font-medium text-sm">{outcome.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white/30 rounded-full" style={{ width: `${outcome.odds}%` }} />
                </div>
                <span className="font-mono font-bold text-sm w-10 text-right">{outcome.odds}%</span>
              </div>
            </div>
          )
        })}
      </div>

      <MarketActionPanel
        market={market as any}
        userId={userId}
        isCreator={isCreator}
        userBet={userBet as any}
        mySubmission={mySubmission as any}
        otherSubmission={otherSubmission as any}
      />
    </div>
  )
}
