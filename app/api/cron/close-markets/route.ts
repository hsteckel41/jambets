import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const preShowClosed = await prisma.market.updateMany({
    where: {
      status: 'OPEN',
      window: { in: ['PRE_SHOW', 'BOTH'] },
      preShowClosesAt: { lte: now },
    },
    data: { status: 'CLOSED' },
  })

  const setBreakClosed = await prisma.market.updateMany({
    where: {
      status: 'OPEN',
      window: { in: ['SET_BREAK', 'BOTH'] },
      setBreakClosesAt: { lte: now },
    },
    data: { status: 'CLOSED' },
  })

  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const timedOutDisputes = await prisma.dispute.findMany({
    where: { status: 'OPEN', createdAt: { lte: oneDayAgo } },
    include: { bet: true },
  })

  for (const dispute of timedOutDisputes) {
    await prisma.$transaction([
      prisma.dispute.update({
        where: { id: dispute.id },
        data: { status: 'RESOLVED', resolution: 'VOID', resolvedAt: now },
      }),
      prisma.bet.update({ where: { id: dispute.betId }, data: { status: 'VOIDED' } }),
      prisma.market.update({ where: { id: dispute.bet.marketId }, data: { status: 'VOIDED' } }),
    ])
  }

  console.log(`[cron/close-markets] pre_show: ${preShowClosed.count}, set_break: ${setBreakClosed.count}, voided: ${timedOutDisputes.length}`)

  return NextResponse.json({
    preShowClosed: preShowClosed.count,
    setBreakClosed: setBreakClosed.count,
    disputesVoided: timedOutDisputes.length,
  })
}
