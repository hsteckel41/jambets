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
}: {
  username: string
  amount?: number
  note: string
}): string {
  const params = new URLSearchParams({
    txn: 'pay',
    recipients: username,
    note: note.slice(0, 255),
    ...(amount ? { amount: amount.toFixed(2) } : {}),
  })
  return `venmo://paycharge?${params.toString()}`
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Taking Action',
    CLOSED: 'Off the Board',
    PENDING_RESULT: 'Truth Time',
    SETTLED: 'Dead & Paid',
    DISPUTED: 'Bad Vibes',
    VOIDED: 'Voided',
  }
  return labels[status] ?? status
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
