import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStatusLabel, getStatusColor, formatShowDate, cn, getMarketCardGradient } from '@/lib/utils'
import { MarketActionPanel } from '@/components/market-action-panel'
import Link from 'next/link'

export default async function MarketPage({ params, searchParams }: { params: { id: string }; searchParams: { new?: string } }) {
  const session = await auth()
  const userId = session?.user?.id

  const market = await prisma.market.findUnique({
    where: { id: params.id },
    include: {
      show: true,
      creator: { select: { id: true, name: true, image: true, username: true, venmoUsername: true } },
      outcomes: true,
      bets: {
        include: {
          bettor: { select: { id: true, name: true, image: true, username: true } },
          outcome: true,
          submissions: true,
          ratings: userId ? { where: { fromUserId: userId }, select: { stars: true } } : false,
          dispute: {
            include: {
              messages: {
                orderBy: { createdAt: 'asc' },
                include: { user: { select: { username: true, name: true } } },
              },
            },
          },
        },
      },
    },
  })

  if (!market) notFound()

  // Fetch current user's Venmo handle for the action panel gate
  const currentUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { venmoUsername: true } })
    : null

  const userBet = market.bets.find((b) => b.bettorId === userId)
  const isCreator = market.creatorId === userId
  // Submissions live on the bet record — use bets[0] for creator since they have no bet entry
  const relevantBet = userBet ?? market.bets[0]
  const mySubmission = relevantBet?.submissions.find((s) => s.userId === userId)
  const otherSubmission = relevantBet?.submissions.find((s) => s.userId !== userId)
  const myRating = userBet?.ratings?.[0] ?? null
  const opponentUserId = isCreator ? market.bets[0]?.bettorId : market.creatorId

  // Lift the dispute from bets[0] to the top-level market shape the action panel expects
  const dispute = market.bets[0]?.dispute ?? null
  const marketForPanel = { ...market, dispute }

  const creatorOutcome = market.outcomes.find((o) => o.isCreatorPick)
  const bettorOutcome = market.outcomes.find((o) => !o.isCreatorPick)
  const creatorName = market.creator.username ? `@${market.creator.username}` : (market.creator.name ?? 'anon')
  const bettor = market.bets[0]?.bettor
  const bettorName = bettor?.username ? `@${bettor.username}` : (bettor?.name ?? null)

  const creatorStake = market.amountDollars ? Number(market.amountDollars) : null
  const takerStake = (creatorStake && creatorOutcome && bettorOutcome && creatorOutcome.odds > 0)
    ? creatorStake * (bettorOutcome.odds / creatorOutcome.odds)
    : null

  const isNewlyCreated = searchParams.new === '1'

  return (
    <div className="space-y-4 animate-fade-in pb-10">

      {/* Newly created banner */}
      {isNewlyCreated && isCreator && (
        <div className="rounded-2xl p-3 border border-[#10B981]/30 bg-[#10B981]/10">
          <p className="text-sm font-semibold text-[#10B981]">Line dropped ✓</p>
          <p className="text-xs text-white/50 mt-0.5">Share it with your crew to find a taker.</p>
        </div>
      )}

      {/* Market card — same style as feed but full-width */}
      <div
        className="rounded-2xl border border-white/[0.08] p-4 space-y-4"
        style={{ background: `${getMarketCardGradient(market.id)}, rgba(255,255,255,0.025)` }}
      >
        {/* Row 1: show info + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/feed?artist=${encodeURIComponent(market.show.artist)}`}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              {market.show.artist} · {market.show.venue} · {formatShowDate(market.show.date)}
            </Link>
            <h1 className="text-xl font-bold mt-1 leading-snug">{market.question}</h1>
          </div>
          <span className={cn('flex-shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border mt-1', getStatusColor(market.status))}>
            {getStatusLabel(market.status)}
          </span>
        </div>

        {/* Row 2: positions side by side */}
        {creatorOutcome && bettorOutcome && (
          <div className="grid grid-cols-2 gap-2">
            <div className="px-3 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] space-y-1">
              <div className="text-[9px] uppercase tracking-widest text-white/25 font-bold">Caller's call</div>
              <div className="font-semibold text-white/90 text-sm leading-snug">{creatorOutcome.label}</div>
              <div className="font-mono text-white/35 text-xs">{creatorOutcome.odds}%</div>
            </div>
            <div className="px-3 py-3 rounded-xl border border-[#10B981]/25 bg-[#10B981]/10 space-y-1">
              <div className="text-[9px] uppercase tracking-widest text-[#10B981]/60 font-bold">
                {bettorName ? "Taker\u2019s side" : "You\u2019d take"}
              </div>
              <div className="font-semibold text-white text-sm leading-snug">{bettorOutcome.label}</div>
              <div className="font-mono text-[#10B981]/60 text-xs">{bettorOutcome.odds}%</div>
            </div>
          </div>
        )}

        {/* Row 3: risk/win — prominent, same phrasing as market card */}
        {creatorStake !== null && takerStake !== null && (
          <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-sm text-white/35 font-mono">
              <span>Caller risks</span>
              <span className="text-white/55">${creatorStake.toFixed(0)}</span>
              <span>·</span>
              <span>wins</span>
              <span className="text-[#10B981]/60 font-semibold">${takerStake.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white/35 font-mono">
              <span>Taker risks</span>
              <span className="text-white/55">${takerStake.toFixed(0)}</span>
              <span>·</span>
              <span>wins</span>
              <span className="text-[#10B981]/60 font-semibold">${creatorStake.toFixed(0)}</span>
            </div>
          </div>
        )}

        {/* Row 4: creator + taker */}
        <div className="flex items-center justify-between text-xs text-white/35 pt-0.5">
          <span>
            <Link href={`/u/${market.creator.username}`} className="text-white/55 hover:text-white/80 transition-colors font-medium">
              {creatorName}
            </Link>
          </span>
          {bettorName
            ? <span>Taker: <span className="text-white/55 font-medium">{bettorName}</span></span>
            : <span className="text-[#10B981]/70 font-medium">Looking for a taker</span>
          }
        </div>
      </div>

      {/* Rules */}
      {market.rules && (
        <div className="gradient-border p-4 space-y-2">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Rules</p>
          <p className="text-sm text-white/70 leading-relaxed">{market.rules}</p>
        </div>
      )}

      {/* Action panel — handles take-bet / submit-result / dispute / settled flows */}
      <MarketActionPanel
        market={marketForPanel as any}
        userId={userId}
        isCreator={isCreator}
        userBet={userBet as any}
        mySubmission={mySubmission as any}
        otherSubmission={otherSubmission as any}
        myRating={myRating as any}
        opponentUserId={opponentUserId}
        userVenmoUsername={currentUser?.venmoUsername}
      />
    </div>
  )
}
