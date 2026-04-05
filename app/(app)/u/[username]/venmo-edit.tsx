'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'

export function VenmoEdit({ currentVenmo }: { currentVenmo?: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(!currentVenmo)
  const [value, setValue] = useState(currentVenmo ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    const trimmed = value.trim().replace(/^@/, '')
    if (!trimmed) {
      setError('Enter your Venmo handle.')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venmoUsername: trimmed }),
    })
    if (res.ok) {
      setEditing(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data?.error ?? 'Could not save. Try again.')
    }
    setLoading(false)
  }

  const cancel = () => {
    setValue(currentVenmo ?? '')
    setError('')
    setEditing(false)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest text-white/25 font-bold">Venmo</label>

      {editing ? (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm select-none">@</span>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/^@/, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save()
                  if (e.key === 'Escape') cancel()
                }}
                placeholder="your-venmo"
                maxLength={30}
                autoFocus
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
              />
            </div>
            <button
              onClick={save}
              disabled={loading}
              className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #10B981)' }}
            >
              {loading ? '…' : 'Save'}
            </button>
            {currentVenmo && (
              <button
                onClick={cancel}
                className="px-2 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
              >
                Cancel
              </button>
            )}
          </div>
          {error && <p className="text-[11px] text-[#F43F5E]">{error}</p>}
          {!currentVenmo && (
            <p className="text-[11px] text-amber-400/70">Required to drop or take bets.</p>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70 font-mono">@{currentVenmo}</span>
          <button
            onClick={() => setEditing(true)}
            className="text-white/25 hover:text-white/60 transition-colors"
            aria-label="Edit Venmo handle"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
