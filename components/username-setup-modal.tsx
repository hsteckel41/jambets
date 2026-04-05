'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function UsernameSetupModal() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (username.length < 2) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/user/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0C0A07]/95 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-4xl mb-4">🎸</div>
          <h1 className="text-2xl font-bold tracking-tight">Claim your handle</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            This is how other bettors know you.<br />Make it count.
          </p>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-base font-medium select-none">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            placeholder="yourhandle"
            maxLength={20}
            autoFocus
            className="w-full bg-white/[0.08] border border-white/15 rounded-xl pl-9 pr-4 py-3.5 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/60 transition-colors"
          />
        </div>

        {error && <p className="text-[#F43F5E] text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={username.length < 2 || loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}
        >
          {loading ? 'Claiming...' : 'Claim It →'}
        </button>

        <p className="text-[11px] text-white/25 leading-relaxed">
          Letters, numbers, underscores only · 2–20 chars
        </p>
      </div>
    </div>
  )
}
