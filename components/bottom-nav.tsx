'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { List, Ticket, User } from 'lucide-react'

interface BottomNavProps {
  username: string | null
}

export function BottomNav({ username }: BottomNavProps) {
  const pathname = usePathname()

  const links = [
    { href: '/feed', label: 'Board', Icon: List },
    { href: '/my-bets', label: 'My Bets', Icon: Ticket },
    { href: username ? `/u/${username}` : '/my-bets', label: 'Profile', Icon: User },
  ]

  return (
    <nav className="sticky bottom-0 bg-[#09090B]/90 backdrop-blur-xl border-t border-white/[0.08] px-6 py-2 flex items-center justify-around">
      {links.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/feed' && href !== '/my-bets' && pathname.startsWith(href))
        return (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-1 transition-colors py-1 min-w-[56px] ${
              active ? 'text-white' : 'text-white/35 hover:text-white/70'
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
