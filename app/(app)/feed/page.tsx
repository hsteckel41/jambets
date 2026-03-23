import { prisma } from '@/lib/prisma'
import { MarketCard } from '@/components/market-card'
import { formatShowDate } from '@/lib/utils'

async function getMarkets(artist?: string) {
  const where: any = { visibility: 'PUBLIC' }
  if (artist) where.show = { artist: { contains: artist, mode: 'insensitive' } }

  return prisma.market.findMany({
    where,
    orderBy: [{ bets: { _count: 'desc' } }, { createdAt: 'desc' }],
    include: {
      show: true,
      creator: { select: { id: true, name: true, image: true, username: true } },
      outcomes: { orderBy: { odds: 'desc' } },
      _count: { select: { bets: true } },
    },
    take: 100,
  })
}

const JAM_BANDS = ['Phish', 'Dead & Co', 'Goose', 'Widespread Panic', 'Billy Strings', "Trey Anastasio", "moe.", "Umphrey's McGee"]

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { artist?: string }
}) {
  const markets = await getMarkets(searchParams.artist)

  const byShow = markets.reduce<Record<string, typeof markets>>((acc, m) => {
    const key = m.showId
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const showGroups = Object.values(byShow).sort((a, b) =>
    new Date(a[0].show.date).getTime() - new Date(b[0].show.date).getTime()
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative py-4">
        <h1 className="text-2xl font-bold tracking-tight">Tonight's Board</h1>
        <p className="text-white/40 text-sm mt-1">The rail is open. What's your read?</p>
      </div>

      {/* Band filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{scrollbarWidth: 'none'}}>
        <a
          href="/feed"
          className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            !searchParams.artist
              ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#7C3AED]'
              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
          }`}
        >
          All Shows
        </a>
        {JAM_BANDS.map((band) => (
          <a
            key={band}
            href={`/feed?artist=${encodeURIComponent(band)}`}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              searchParams.artist === band
                ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#7C3AED]'
                : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
            }`}
          >
            {band}
          </a>
        ))}
      </div>

      {showGroups.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🎸</p>
          <p className="text-white/60 font-medium">Nothing on the rail yet.</p>
          <p className="text-white/30 text-sm">Be the first to write a line.</p>
          <a href="/market/new" className="inline-block mt-2 text-sm font-semibold text-[#7C3AED]">
            Write the Line →
          </a>
        </div>
      ) : (
        showGroups.map((group) => {
          const show = group[0].show
          return (
            <div key={show.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base">{show.artist}</h2>
                  <p className="text-xs text-white/40">
                    {show.venue} · {show.city} · {formatShowDate(show.date)}
                  </p>
                </div>
                <span className="text-xs text-white/25">{group.length} market{group.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {group.map((market) => (
                  <MarketCard key={market.id} market={market as any} />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
