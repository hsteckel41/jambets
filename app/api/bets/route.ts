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

  const { marketId, outcomeId } = parsed.data
  const userId = session.user.id

  const taker = await prisma.user.findUnique({
    where: { id: userId },
    select: { venmoUsername: true },
  })
  if (!taker?.venmoUsername) {
    return NextResponse.json({ error: 'venmo_required', message: 'Add your Venmo handle on your profile before taking a bet.' }, { status: 400 })
  }

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

  // Bettor cannot take the creator's side
  const creatorOutcome = market.outcomes.find((o) => o.isCreatorPick)
  const takerOutcome = market.outcomes.find((o) => !o.isCreatorPick)
  if (creatorOutcome && outcomeId === creatorOutcome.id) {
    return NextResponse.json({ error: 'Cannot take the same side as the creator' }, { status: 409 })
  }

  // Odds-adjusted taker stake: takerStake = creatorStake × (takerOdds / creatorOdds)
  // This ensures fair expected value for both sides
  let takerStake: number | null = null
  if (market.amountDollars && creatorOutcome && takerOutcome && creatorOutcome.odds > 0) {
    takerStake = Number(market.amountDollars) * (takerOutcome.odds / creatorOutcome.odds)
  }

  const [bet] = await prisma.$transaction([
    prisma.bet.create({
      data: {
        marketId,
        bettorId: userId,
        outcomeId,
        amountDollars: takerStake ?? null,
        venmoUsername: taker.venmoUsername,
      },
    }),
    prisma.market.update({
      where: { id: marketId },
      data: { bettorId: userId, status: 'CLOSED' },
    }),
  ])

  return NextResponse.json({ bet }, { status: 201 })
}
