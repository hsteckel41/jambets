import { prisma } from '@/lib/prisma'
import { MarketCard } from '@/components/market-card'

async function getMarkets(artist?: string) {
  const where: any = {
    visibility: 'PUBLIC',
    status: { not: 'DISPUTED' }, // keep disputes off the feed
  }
  if (artist && artist !== 'Other') {
    where.show = { artist: { contains: artist, mode: 'insensitive' } }
  } else if (artist === 'Other') {
    // "Other" = any artist not in the main list
    const MAIN_ARTISTS = [
      'Phish', 'Goose', 'Widespread Panic', 'Billy Strings', 'moe.',
      "Umphrey's McGee", 'String Cheese Incident', 'Eggy',
      'Dave Matthews Band', 'King Gizzard and the Lizard Wizard', 'Spafford',
    ]
    where.show = { artist: { notIn: MAIN_ARTISTS } }
  }

  return prisma.market.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    include: {
      show: true,
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
          ratingsReceived: { select: { stars: true } },
        },
      },
      outcomes: { orderBy: { odds: 'desc' } },
      _count: { select: { bets: true } },
    },
    take: 100,
  })
}

const JAM_BANDS = [
  'Phish',
  'Goose',
  'Widespread Panic',
  'Billy Strings',
  'moe.',
  "Umphrey's McGee",
  'String Cheese Incident',
  'Eggy',
  'Dave Matthews Band',
  'King Gizzard and the Lizard Wizard',
  'Spafford',
  'Other',
]

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { artist?: string }
}) {
  const markets = await getMarkets(searchParams.artist)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Band filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 pt-1" style={{ scrollbarWidth: 'none' }}>
        <a
          href="/feed"
          className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            !searchParams.artist
              ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#7C3AED]'
              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
          }`}
        >
          All
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

      {markets.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🎸</p>
          <p className="text-white/60 font-medium">Nothing on the lot yet.</p>
          <p className="text-white/30 text-sm">Be the first to drop a bet.</p>
          <a href="/market/new" className="inline-block mt-2 text-sm font-semibold text-[#7C3AED]">
            Drop a Bet →
          </a>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: '8px' }}>
          {markets.map((market) => (
            <MarketCard key={market.id} market={market as any} />
          ))}
        </div>
      )}
    </div>
  )
}
