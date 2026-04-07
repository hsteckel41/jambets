import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NewMarketForm } from './new-market-form'

export default async function NewMarketPage() {
  const session = await auth()
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { venmoUsername: true },
      })
    : null

  return <NewMarketForm initialVenmo={user?.venmoUsername} />
}
