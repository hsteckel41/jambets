import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatShowDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Tonight'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d')
}

export function buildVenmoLink({
  username,
  amount,
  note,
  txn = 'pay',
}: {
  username: string
  amount?: number
  note: string
  txn?: 'pay' | 'charge'
}): string {
  const params = new URLSearchParams({
    txn,
    recipients: username,
    note: note.slice(0, 255),
    ...(amount ? { amount: amount.toFixed(2) } : {}),
  })
  return `venmo://paycharge?${params.toString()}`
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Open',
    CLOSED: 'Closed',
    PENDING_RESULT: 'Truth Time',
    SETTLED: 'Settled',
    DISPUTED: 'Disputed',
    VOIDED: 'Voided',
  }
  return labels[status] ?? status
}

// Deterministic pastel gradient per market ID — same gradient always appears for the same market
export function getMarketCardGradient(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const variants = [
    'radial-gradient(ellipse 60% 40% at 18% 55%, rgba(167,139,250,0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 35% at 82% 78%, rgba(251,146,60,0.07) 0%, transparent 70%)',
    'radial-gradient(ellipse 70% 45% at 52% 12%, rgba(244,114,182,0.09) 0%, transparent 65%), radial-gradient(ellipse 45% 50% at 78% 72%, rgba(124,58,237,0.10) 0%, transparent 65%)',
    'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, transparent 50%), radial-gradient(ellipse 55% 30% at 45% 90%, rgba(16,185,129,0.08) 0%, transparent 65%)',
    'radial-gradient(ellipse 55% 60% at 72% 38%, rgba(125,211,252,0.08) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 22% 80%, rgba(244,114,182,0.09) 0%, transparent 65%)',
    'radial-gradient(ellipse 80% 40% at 38% 5%, rgba(124,58,237,0.11) 0%, transparent 60%), radial-gradient(ellipse 60% 30% at 65% 95%, rgba(251,191,36,0.06) 0%, transparent 60%)',
    'radial-gradient(ellipse 50% 55% at 80% 45%, rgba(167,139,250,0.09) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 12% 18%, rgba(16,185,129,0.08) 0%, transparent 60%)',
    'radial-gradient(ellipse 65% 50% at 48% 55%, rgba(251,146,60,0.07) 0%, transparent 65%), radial-gradient(ellipse 40% 60% at 5% 40%, rgba(124,58,237,0.09) 0%, transparent 60%)',
    'linear-gradient(160deg, rgba(244,114,182,0.07) 0%, rgba(124,58,237,0.09) 50%, transparent 75%), radial-gradient(ellipse 40% 30% at 70% 85%, rgba(16,185,129,0.07) 0%, transparent 60%)',
  ]
  return variants[hash % variants.length]
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: 'text-jam-emerald bg-jam-emerald/10 border-jam-emerald/20',
    CLOSED: 'text-white/40 bg-white/5 border-white/10',
    PENDING_RESULT: 'text-jam-amber bg-jam-amber/10 border-jam-amber/20',
    SETTLED: 'text-jam-emerald bg-jam-emerald/10 border-jam-emerald/20',
    DISPUTED: 'text-jam-rose bg-jam-rose/10 border-jam-rose/20',
    VOIDED: 'text-white/30 bg-white/5 border-white/10',
  }
  return colors[status] ?? 'text-white/40'
}
