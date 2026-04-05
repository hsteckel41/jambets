import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createMarketSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const artist = searchParams.get('artist')
  const status = searchParams.get('status')
  const sort = searchParams.get('sort') ?? 'hot'
  const visibility = searchParams.get('visibility') ?? 'PUBLIC'

  const where: any = { visibility }
  if (status) where.status = status
  if (artist) where.show = { artist: { contains: artist, mode: 'insensitive' } }

  const orderBy = sort === 'hot'
    ? [{ bets: { _count: 'desc' as const } }, { createdAt: 'desc' as const }]
    : [{ createdAt: 'desc' as const }]

  const markets = await prisma.market.findMany({
    where,
    orderBy,
    include: {
      show: true,
      creator: { select: { id: true, name: true, image: true, username: true } },
      outcomes: true,
      _count: { select: { bets: true } },
    },
    take: 50,
  })

  return NextResponse.json({ markets })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creator = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { venmoUsername: true },
  })
  if (!creator?.venmoUsername) {
    return NextResponse.json({ error: 'venmo_required', message: 'Add your Venmo handle on your profile before dropping a bet.' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = createMarketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  let showId = data.showId
  let showDate: Date | null = null

  if (!showId && data.manualShow) {
    const show = await prisma.show.create({
      data: {
        artist: data.manualShow.artist,
        venue: data.manualShow.venue,
        city: data.manualShow.city,
        date: new Date(data.manualShow.date),
      },
    })
    showId = show.id
    showDate = show.date
  } else if (showId) {
    const show = await prisma.show.findUnique({ where: { id: showId }, select: { date: true } })
    showDate = show?.date ?? null
  }

  if (!showId) {
    return NextResponse.json({ error: 'Show is required' }, { status: 400 })
  }

  // Compute expiresAt: show date + 1 day at 08:00 UTC
  let expiresAt: Date | null = null
  if (showDate) {
    const d = new Date(showDate)
    expiresAt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 8, 0, 0))
  }

  try {
    const market = await prisma.market.create({
      data: {
        showId,
        creatorId: session.user.id,
        question: data.question,
        rules: data.rules,
        visibility: data.visibility,
        amountDollars: data.amountDollars ?? null,
        expiresAt,
        outcomes: {
          create: data.outcomes.map((o) => ({
            label: o.label,
            odds: o.odds,
            isCreatorPick: o.isCreatorPick,
          })),
        },
      },
      include: { outcomes: true, show: true },
    })

    return NextResponse.json({ market }, { status: 201 })
  } catch (err) {
    console.error('Market create error:', err)
    return NextResponse.json({ error: 'Failed to create market' }, { status: 500 })
  }
}
