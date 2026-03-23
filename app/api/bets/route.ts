import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { placeBetSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = placeBetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { marketId, outcomeId, amountDollars, venmoUsername } = parsed.data
  const userId = session.user.id

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { outcomes: true },
  })

  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  if (market.status !== 'OPEN') return NextResponse.json({ error: 'Market is not open' }, { status: 409 })
  if (market.bettorId) return NextResponse.json({ error: 'Market already claimed' }, { status: 409 })
  if (market.creatorId === userId) return NextResponse.json({ error: 'Cannot bet on your own market' }, { status: 409 })

  const outcome = market.outcomes.find((o) => o.id === outcomeId)
  if (!outcome) return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 })

  const [bet] = await prisma.$transaction([
    prisma.bet.create({
      data: {
        marketId,
        bettorId: userId,
        outcomeId,
        amountDollars: amountDollars ?? null,
        venmoUsername: venmoUsername ?? null,
      },
    }),
    prisma.market.update({
      where: { id: marketId },
      data: { bettorId: userId, status: 'CLOSED' },
    }),
  ])

  return NextResponse.json({ bet }, { status: 201 })
}
