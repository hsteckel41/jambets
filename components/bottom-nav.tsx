'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, PenLine, Ticket } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: '/feed', label: 'Board', Icon: LayoutGrid },
    { href: '/market/new', label: 'Write', Icon: PenLine },
    { href: '/my-bets', label: 'My Bets', Icon: Ticket },
  ]

  return (
    <nav className="sticky bottom-0 bg-[#09090B]/90 backdrop-blur-xl border-t border-white/[0.08] px-6 py-2 flex items-center justify-around">
      {links.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/feed' && pathname.startsWith(href))
        return (
          <Link
            key={href}
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
