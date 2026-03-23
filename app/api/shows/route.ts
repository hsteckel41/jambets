import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const upcoming = searchParams.get('upcoming') === 'true'

  if (q && process.env.SETLISTFM_API_KEY) {
    try {
      const res = await fetch(
        `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(q)}&p=1`,
        {
          headers: {
            'Accept': 'application/json',
            'x-api-key': process.env.SETLISTFM_API_KEY,
          },
          next: { revalidate: 3600 },
        }
      )
      if (res.ok) {
        const data = await res.json()
        const shows = (data.setlist ?? []).slice(0, 10).map((s: any) => ({
          id: `setlistfm_${s.id}`,
          artist: s.artist?.name ?? q,
          venue: s.venue?.name ?? '',
          city: s.venue?.city?.name ?? '',
          date: s.eventDate,
          setlistFmId: s.id,
          source: 'setlistfm',
        }))
        return NextResponse.json({ shows })
      }
    } catch {
      // fall through to DB
    }
  }

  const where: any = {}
  if (q) {
    where.OR = [
      { artist: { contains: q, mode: 'insensitive' } },
      { venue: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (upcoming) {
    where.date = { gte: new Date() }
  }

  const shows = await prisma.show.findMany({
    where,
    orderBy: { date: 'asc' },
    take: 20,
  })

  return NextResponse.json({ shows })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { artist, venue, city, date } = body

  if (!artist || !venue || !city || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const show = await prisma.show.create({
    data: {
      artist: artist.trim(),
      venue: venue.trim(),
      city: city.trim(),
      date: new Date(date),
    },
  })

  return NextResponse.json({ show }, { status: 201 })
}
