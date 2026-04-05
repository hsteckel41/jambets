import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { cn, getMarketCardGradient } from '@/lib/utils'
import { ProfileImageEdit } from './profile-image-edit'
import { VenmoEdit } from './venmo-edit'

function StatusPill({ status }: { status: string }) {
  if (status === 'OPEN') return (
    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10B981] text-[#0C0A07]">Open</span>
  )
  if (status === 'SETTLED') return (
    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#10B981]/30 text-[#10B981]/70">Settled</span>
  )
  if (status === 'DISPUTED') return (
    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#F43F5E]/30 text-[#F43F5E]/80">Disputed</span>
  )
  if (status === 'PENDING_RESULT') return (
    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-400/40 text-amber-400/90">Truth Time</span>
  )
  return (
    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/15 text-white/40">Taken</span>
  )
}

function LightningDisplay({ avg, count }: { avg: number; count: number }) {
  const full = Math.floor(avg)
  const hasHalf = (Math.round(avg * 2) / 2) % 1 !== 0
  const empty = 5 - full - (hasHalf ? 1 : 0)
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => <span key={`f${i}`} className="text-base">⚡</span>)}
        {hasHalf && <span className="text-base opacity-40">⚡</span>}
        {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-base opacity-15">⚡</span>)}
      </div>
      <span className="text-xs text-white/40 font-mono">{avg.toFixed(1)}</span>
      <span className="text-xs text-white/25">({count})</span>
    </div>
  )
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const session = await auth()
  const currentUserId = session?.user?.id

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      venmoUsername: true,
      createdAt: true,
      ratingsReceived: {
        select: {
          stars: true,
          review: true,
          createdAt: true,
          from: { select: { username: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) notFound()

  const isOwn = user.id === currentUserId

  const [createdMarkets, placedBets, resultSubmissions] = await Promise.all([
    prisma.market.findMany({
      where: {
        creatorId: user.id,
        ...(isOwn ? {} : { visibility: 'PUBLIC' }),
      },
      include: {
        show: true,
        outcomes: true,
        _count: { select: { bets: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.bet.findMany({
      where: { bettorId: user.id },
      include: {
        market: { include: { show: true } },
        outcome: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    }),
    // All result submissions by this user on settled bets
    prisma.resultSubmission.findMany({
      where: {
        userId: user.id,
        bet: { market: { status: 'SETTLED' } },
      },
      select: { claim: true },
    }),
  ])

  const visibleBets = isOwn ? placedBets : placedBets.filter((b) => b.market.visibility === 'PUBLIC')

  const wins = resultSubmissions.filter((s) => s.claim === 'WON').length
  const losses = resultSubmissions.filter((s) => s.claim === 'LOST').length

  // Vibe rating
  const ratings = user.ratingsReceived
  const avgRating = ratings.length > 0
    ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
    : null
  const reviewsWithText = ratings.filter((r) => r.review && r.review.trim().length > 0)

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Profile header */}
      <div className="gradient-border p-5 space-y-4">
        <div className="flex items-center gap-4">
          {/* Avatar with edit button for own profile */}
          <div className="relative flex-shrink-0">
            {user.image ? (
              <img src={user.image} alt={user.name ?? ''} className="w-16 h-16 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-2xl font-bold text-[#7C3AED]">
                {(user.username ?? user.name ?? '?')[0].toUpperCase()}
              </div>
            )}
            {isOwn && (
              <ProfileImageEdit currentImage={user.image} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight">@{user.username}</h1>
            {user.name && user.name !== user.username && (
              <p className="text-sm text-white/40">{user.name}</p>
            )}
            {/* Vibe rating */}
            {avgRating !== null ? (
              <div className="mt-1.5">
                <LightningDisplay avg={avgRating} count={ratings.length} />
              </div>
            ) : (
              <p className="text-xs text-white/20 mt-1">No ratings yet</p>
            )}
          </div>
        </div>

        {/* Venmo — editable on own profile, read-only on others */}
        {isOwn ? (
          <VenmoEdit currentVenmo={user.venmoUsername} />
        ) : user.venmoUsername ? (
          <p className="text-xs text-white/30 font-mono">@{user.venmoUsername} on Venmo</p>
        ) : null}

        {/* Stats — 4 columns */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-white/[0.06]">
          <div className="text-center">
            <p className="text-lg font-bold font-mono tabular-nums">{createdMarkets.length}</p>
            <p className="text-[10px] text-white/35 mt-0.5">Lines</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono tabular-nums">{visibleBets.length}</p>
            <p className="text-[10px] text-white/35 mt-0.5">Taken</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono tabular-nums text-[#10B981]">{wins}</p>
            <p className="text-[10px] text-white/35 mt-0.5">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono tabular-nums text-[#F43F5E]">{losses}</p>
            <p className="text-[10px] text-white/35 mt-0.5">Losses</p>
          </div>
        </div>
      </div>

      {/* Vibe reviews */}
      {reviewsWithText.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Vibe Reviews</h2>
          <div className="space-y-2">
            {reviewsWithText.map((r, i) => (
              <div key={i} className="gradient-border px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">@{r.from.username ?? r.from.name ?? 'anon'}</span>
                  <span className="text-xs">
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <span key={j}>⚡</span>
                    ))}
                    {Array.from({ length: 5 - r.stars }).map((_, j) => (
                      <span key={j} className="opacity-20">⚡</span>
                    ))}
                  </span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{r.review}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lines dropped */}
      {createdMarkets.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Lines</h2>
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
                    {market.show.artist} · {market._count.bets === 0 ? 'No takers' : `${market._count.bets} bet`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bets taken */}
      {visibleBets.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Bets taken</h2>
          <div className="flex flex-col" style={{ gap: '8px' }}>
            {visibleBets.slice(0, 20).map((bet) => (
              <Link key={bet.id} href={`/market/${bet.market.id}`}>
                <div
                  className="rounded-2xl border border-white/[0.08] p-4 hover:border-white/[0.14] transition-all"
                  style={{ background: `${getMarketCardGradient(bet.market.id)}, rgba(255,255,255,0.025)` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{bet.market.question}</p>
                    <StatusPill status={bet.market.status} />
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    {bet.market.show.artist} · <span className="text-white/60">{bet.outcome.label}</span>{' '}
                    <span className="text-white/25">({bet.outcome.odds}%)</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {createdMarkets.length === 0 && visibleBets.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🎸</p>
          <p className="text-white/60 font-medium">No action yet.</p>
          {isOwn && (
            <>
              <p className="text-white/30 text-sm">Drop a bet or take someone&rsquo;s line.</p>
              <Link href="/feed" className="inline-block mt-2 text-sm font-semibold text-[#7C3AED]">
                Back to the Board →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
