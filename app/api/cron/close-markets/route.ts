import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // OPEN markets past expiresAt with no bettor → VOIDED (no one took it)
  const voided = await prisma.market.updateMany({
    where: {
      status: 'OPEN',
      expiresAt: { lte: now },
      bettorId: null,
    },
    data: { status: 'VOIDED' },
  })

  // OPEN markets past expiresAt with a bettor → PENDING_RESULT (show ended, time to submit)
  const pendingResult = await prisma.market.updateMany({
    where: {
      status: 'OPEN',
      expiresAt: { lte: now },
      bettorId: { not: null },
    },
    data: { status: 'PENDING_RESULT' },
  })

  // Also close CLOSED markets that have passed expiresAt → PENDING_RESULT
  const closedToPending = await prisma.market.updateMany({
    where: {
      status: 'CLOSED',
      expiresAt: { lte: now },
      bettorId: { not: null },
    },
    data: { status: 'PENDING_RESULT' },
  })

  // Dispute timeout: disputes open for more than 24h → VOID
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

  console.log(
    `[cron/close-markets] voided: ${voided.count}, pending_result: ${pendingResult.count + closedToPending.count}, disputes_voided: ${timedOutDisputes.length}`
  )

  return NextResponse.json({
    voided: voided.count,
    pendingResult: pendingResult.count + closedToPending.count,
    disputesVoided: timedOutDisputes.length,
  })
}
