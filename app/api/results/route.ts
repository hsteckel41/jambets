import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { submitResultSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = submitResultSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { betId, claim, explanation } = parsed.data
  const userId = session.user.id

  const bet = await prisma.bet.findUnique({
    where: { id: betId },
    include: {
      market: { include: { creator: true } },
      submissions: true,
    },
  })

  if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 })

  const isCreator = bet.market.creatorId === userId
  const isBettor = bet.bettorId === userId
  if (!isCreator && !isBettor) {
    return NextResponse.json({ error: 'Not part of this bet' }, { status: 403 })
  }

  await prisma.resultSubmission.upsert({
    where: { betId_userId: { betId, userId } },
    update: { claim, explanation },
    create: { betId, userId, claim, explanation },
  })

  const submissions = await prisma.resultSubmission.findMany({ where: { betId } })
  const creatorSub = submissions.find((s) => s.userId === bet.market.creatorId)
  const bettorSub = submissions.find((s) => s.userId === bet.bettorId)

  if (!creatorSub || !bettorSub) {
    await prisma.market.update({ where: { id: bet.marketId }, data: { status: 'PENDING_RESULT' } })
    return NextResponse.json({ status: 'awaiting_other_party' })
  }

  const creatorWon = creatorSub.claim === 'WON'
  const bettorWon = bettorSub.claim === 'WON'

  if (creatorWon !== bettorWon) {
    await prisma.$transaction([
      prisma.bet.update({ where: { id: betId }, data: { status: 'SETTLED' } }),
      prisma.market.update({ where: { id: bet.marketId }, data: { status: 'SETTLED' } }),
    ])
    return NextResponse.json({ status: 'settled', winner: creatorWon ? 'creator' : 'bettor' })
  } else {
    await prisma.$transaction([
      prisma.bet.update({ where: { id: betId }, data: { status: 'DISPUTED' } }),
      prisma.market.update({ where: { id: bet.marketId }, data: { status: 'DISPUTED' } }),
      prisma.dispute.upsert({
        where: { betId },
        update: { reason: creatorWon ? 'BOTH_WON' : 'BOTH_LOST' },
        create: { betId, reason: creatorWon ? 'BOTH_WON' : 'BOTH_LOST' },
      }),
    ])
    return NextResponse.json({ status: 'disputed' })
  }
}
