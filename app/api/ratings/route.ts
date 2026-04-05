import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ratingSchema = z.object({
  betId: z.string(),
  toUserId: z.string(),
  stars: z.number().int().min(1).max(5),
  review: z.string().max(280).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = ratingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { betId, toUserId, stars, review } = parsed.data
  const userId = session.user.id

  if (userId === toUserId) {
    return NextResponse.json({ error: 'Cannot rate yourself' }, { status: 400 })
  }

  // Verify user is a participant in this bet
  const bet = await prisma.bet.findUnique({
    where: { id: betId },
    include: { market: { select: { creatorId: true, status: true } } },
  })

  if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 })

  const isParticipant = bet.bettorId === userId || bet.market.creatorId === userId
  if (!isParticipant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (bet.market.status !== 'SETTLED') {
    return NextResponse.json({ error: 'Can only rate after settlement' }, { status: 409 })
  }

  try {
    const rating = await prisma.userRating.create({
      data: { fromUserId: userId, toUserId, betId, stars, review },
    })
    return NextResponse.json({ rating })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Already rated for this bet' }, { status: 409 })
    }
    throw e
  }
}
