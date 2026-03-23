import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const pendingBets = await prisma.bet.findMany({
    where: {
      status: 'PLACED',
      market: {
        status: { in: ['CLOSED', 'PENDING_RESULT'] },
        show: { date: { gte: yesterday, lt: today } },
      },
    },
    include: {
      market: { include: { show: true } },
      bettor: { select: { email: true, name: true } },
      submissions: { select: { userId: true } },
    },
  })

  let sent = 0
  const emailsSent = new Set<string>()

  for (const bet of pendingBets) {
    const bettorSubmitted = bet.submissions.some((s) => s.userId === bet.bettorId)
    if (bettorSubmitted) continue
    if (!bet.bettor.email) continue
    if (emailsSent.has(bet.bettor.email)) continue

    const showName = `${bet.market.show.artist} @ ${bet.market.show.venue}`

    try {
      await resend.emails.send({
        from: 'JamBets <noreply@jambets.app>',
        to: bet.bettor.email,
        subject: `☀️ Alright, the lights are up. How'd it go?`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#09090B;color:#fff;border-radius:12px;">
            <h2 style="margin:0 0 8px;font-size:20px;">Time to settle the score.</h2>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 20px;">
              You have unsubmitted results from <strong style="color:#fff;">${showName}</strong>.
            </p>
            <a href="${process.env.NEXTAUTH_URL}/my-bets" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
              Submit Your Results →
            </a>
          </div>
        `,
      })
      emailsSent.add(bet.bettor.email)
      sent++
    } catch (err) {
      console.error(`[cron/email-reminders] Failed to send to ${bet.bettor.email}:`, err)
    }
  }

  return NextResponse.json({ sent })
}
