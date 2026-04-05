import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { action } = body as { action: 'concede' | 'void' }
  if (action !== 'concede' && action !== 'void') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const userId = session.user.id

  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: {
      bet: {
        include: { market: true },
      },
    },
  })

  if (!dispute) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
  }

  if (dispute.status !== 'OPEN') {
    return NextResponse.json({ error: 'Dispute already resolved' }, { status: 409 })
  }

  const bet = dispute.bet
  const isCreator = bet.market.creatorId === userId
  const isBettor = bet.bettorId === userId

  if (!isCreator && !isBettor) {
    return NextResponse.json({ error: 'Not part of this dispute' }, { status: 403 })
  }

  const now = new Date()

  if (action === 'void') {
    await prisma.$transaction([
      prisma.dispute.update({
        where: { id: dispute.id },
        data: { status: 'RESOLVED', resolution: 'VOID', resolvedAt: now },
      }),
      prisma.bet.update({ where: { id: bet.id }, data: { status: 'VOIDED' } }),
      prisma.market.update({ where: { id: bet.marketId }, data: { status: 'VOIDED' } }),
    ])
    return NextResponse.json({ status: 'voided' })
  }

  // concede: current user admits they lost → other party wins
  const resolution = isCreator ? 'WON_BY_BETTOR' : 'WON_BY_CREATOR'

  await prisma.$transaction([
    prisma.dispute.update({
      where: { id: dispute.id },
      data: { status: 'RESOLVED', resolution, resolvedAt: now },
    }),
    prisma.bet.update({ where: { id: bet.id }, data: { status: 'SETTLED' } }),
    prisma.market.update({ where: { id: bet.marketId }, data: { status: 'SETTLED' } }),
  ])

  return NextResponse.json({ status: 'settled', resolution })
}
