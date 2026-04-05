import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { usernameSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = usernameSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { username } = parsed.data

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Username taken' }, { status: 409 })
    }
    console.error('Username update error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
