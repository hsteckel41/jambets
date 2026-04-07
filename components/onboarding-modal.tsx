'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function OnboardingModal() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const dismiss = async () => {
    setLoading(true)
    await fetch('/api/user/onboarding', { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center px-0 sm:px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a1520 0%, #0C0A07 60%)' }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7C3AED, #10B981)' }} />

        <div className="px-6 pt-7 pb-8 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#7C3AED]">Welcome to JamBets</p>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-white">
              No house.<br />Just fans.
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Peer-to-peer betting for the lot. You write the line, someone takes it, and you settle after the show — on your honor.
            </p>
          </div>

          {/* Sample bet card — visual hook */}
          <div
            className="rounded-2xl border border-white/[0.09] px-4 py-3.5 space-y-2"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 50%, rgba(124,58,237,0.12) 0%, transparent 70%), rgba(255,255,255,0.03)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Open Bet · Phish · MSG</p>
            <p className="text-sm font-semibold text-white">Will they open with Tweezer?</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#10B981]/60 mb-0.5">You&apos;d take</p>
                <p className="text-sm font-bold text-white">NO — 45%</p>
              </div>
              <div className="text-xs text-white/20 flex-shrink-0">vs</div>
              <div className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-0.5">Caller says</p>
                <p className="text-sm font-bold text-white/60">YES — 55%</p>
              </div>
            </div>
          </div>

          {/* Three bullets */}
          <ul className="space-y-3">
            {[
              { icon: '⚡', text: 'Your odds, your call — you set the line.' },
              { icon: '💸', text: 'Winner collects via Venmo. No middleman, no rake.' },
              { icon: '🏆', text: 'Your ⚡ rating follows you show to show. Reputation is everything.' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <span className="text-sm text-white/55 leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={dismiss}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #10B981)' }}
          >
            {loading ? 'Loading…' : "Got It. Let's Bet →"}
          </button>
        </div>
      </div>
    </div>
  )
}
