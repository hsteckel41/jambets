import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const profileSchema = z.object({
  image: z.string().url().nullable().optional(),
  venmoUsername: z.string().max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Venmo handle can only contain letters, numbers, _ or -').nullable().optional(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updateData: { image?: string | null; venmoUsername?: string | null } = {}
  if ('image' in parsed.data) updateData.image = parsed.data.image ?? null
  if ('venmoUsername' in parsed.data) updateData.venmoUsername = parsed.data.venmoUsername ?? null

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, image: true, venmoUsername: true },
  })

  return NextResponse.json({ user })
}
