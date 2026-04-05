import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const messageSchema = z.object({
  message: z.string().min(1).max(500),
})

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const userId = session.user.id

  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: {
      bet: {
        select: {
          bettorId: true,
          market: { select: { creatorId: true } },
        },
      },
    },
  })

  if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })

  const isParticipant =
    dispute.bet.bettorId === userId || dispute.bet.market.creatorId === userId
  if (!isParticipant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const msg = await prisma.disputeMessage.create({
    data: { disputeId: params.id, userId, message: parsed.data.message },
    include: { user: { select: { username: true, name: true } } },
  })

  return NextResponse.json({ message: msg })
}
