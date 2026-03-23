'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buildVenmoLink, cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface Props {
  market: any
  userId?: string
  isCreator: boolean
  userBet?: any
  mySubmission?: any
  otherSubmission?: any
}

export function MarketActionPanel({ market, userId, isCreator, userBet, mySubmission, otherSubmission }: Props) {
  const router = useRouter()
  const [selectedOutcome, setSelectedOutcome] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [venmo, setVenmo] = useState('')
  const [claim, setClaim] = useState<'WON' | 'LOST' | ''>('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canBet = market.status === 'OPEN' && !isCreator && !userBet && userId
  const canSubmitResult = ['CLOSED', 'PENDING_RESULT'].includes(market.status) && (isCreator || userBet) && !mySubmission

  const OUTCOME_COLORS_SELECTED = [
    'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-white',
    'bg-[#10B981]/15 border-[#10B981]/40 text-white',
    'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-white',
    'bg-[#F43F5E]/15 border-[#F43F5E]/30 text-white',
  ]

  const placeBet = async () => {
    if (!selectedOutcome) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marketId: market.id,
        outcomeId: selectedOutcome,
        amountDollars: amount ? parseFloat(amount) : undefined,
        venmoUsername: venmo || undefined,
      }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const err = await res.json()
      setError(err.error ?? 'Something went wrong.')
    }
    setLoading(false)
  }

  const submitResult = async () => {
    if (!claim) return
    setLoading(true)
    setError('')
    const betId = userBet?.id ?? market.bets[0]?.id
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betId, claim, explanation }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const err = await res.json()
      setError(err.error ?? 'Something went wrong.')
    }
    setLoading(false)
  }

  const shareLink = () => {
    const url = `${window.location.origin}/market/${market.id}`
    if (navigator.share) {
      navigator.share({ title: market.question, url })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="space-y-3">
      {canBet && (
        <div className="gradient-border p-4 space-y-4">
          <div>
            <p className="font-semibold text-sm mb-0.5">Call it →</p>
            <p className="text-xs text-white/40">Pick your side. Make your call.</p>
          </div>

          <div className="space-y-2">
            {market.outcomes.map((o: any, i: number) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedOutcome(o.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-3 rounded-xl border text-left transition-all',
                  selectedOutcome === o.id
                    ? OUTCOME_COLORS_SELECTED[i % OUTCOME_COLORS_SELECTED.length]
                    : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:border-white/20'
                )}
              >
                <span className="font-medium text-sm">{o.label}</span>
                <span className="font-mono font-bold text-sm">{o.odds}%</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-white/40">Bet amount (optional)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="20"
                  min="1"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/40">Your Venmo @</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                <input
                  type="text"
                  value={venmo}
                  onChange={(e) => setVenmo(e.target.value)}
                  placeholder="username"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-[#F43F5E] text-xs">{error}</p>}

          <button
            onClick={placeBet}
            disabled={!selectedOutcome || loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{background: 'linear-gradient(135deg, #7C3AED, #4F46E5)'}}
          >
            {loading ? 'Locking in...' : "I'll Call It →"}
          </button>
        </div>
      )}

      {canSubmitResult && (
        <div className="gradient-border p-4 space-y-4" style={{borderColor: 'rgba(245,158,11,0.2)'}}>
          <div>
            <p className="font-semibold text-sm mb-0.5">⏰ Truth Time</p>
            <p className="text-xs text-white/40">The other party submits independently. Be honest.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['WON', 'LOST'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setClaim(c)}
                className={cn(
                  'py-3 rounded-xl border font-bold text-sm transition-all',
                  claim === c
                    ? c === 'WON' ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]' : 'bg-[#F43F5E]/20 border-[#F43F5E]/40 text-[#F43F5E]'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:border-white/20'
                )}
              >
                {c === 'WON' ? '🤑 I Won' : '💸 I Lost'}
              </button>
            ))}
          </div>

          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="One sentence — what happened?"
            rows={2}
            maxLength={280}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors resize-none"
          />

          {error && <p className="text-[#F43F5E] text-xs">{error}</p>}

          <button
            onClick={submitResult}
            disabled={!claim || explanation.trim().length < 5 || loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] disabled:opacity-40 hover:bg-[#F59E0B]/30 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit My Result'}
          </button>
        </div>
      )}

      {mySubmission && !otherSubmission && (
        <div className="gradient-border p-4 text-center space-y-1">
          <p className="text-sm font-medium">Result submitted ✓</p>
          <p className="text-xs text-white/40">You called {mySubmission.claim === 'WON' ? 'W' : 'L'}. Waiting on the other party.</p>
        </div>
      )}

      {market.status === 'SETTLED' && mySubmission?.claim === 'WON' && (
        <div className="gradient-border p-4 space-y-3" style={{borderColor: 'rgba(16,185,129,0.2)'}}>
          <p className="font-semibold text-[#10B981]">🎉 Dead & Paid — You Won</p>
          {market.creator.venmoUsername && (
            <a
              href={buildVenmoLink({ username: market.creator.venmoUsername, note: `JamBets: ${market.question}`, amount: userBet?.amountDollars ? parseFloat(userBet.amountDollars) : undefined })}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              Collect from @{market.creator.venmoUsername} on Venmo <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {market.status === 'DISPUTED' && (
        <div className="gradient-border p-4 space-y-3" style={{borderColor: 'rgba(244,63,94,0.2)'}}>
          <p className="font-semibold text-[#F43F5E]">⚠️ Bad Vibes — Dispute</p>
          <p className="text-xs text-white/50">Both parties claimed the same result. Review explanations and re-submit.</p>
          {mySubmission && <p className="text-xs text-white/40">Your claim: <span className="text-white/70">{mySubmission.explanation}</span></p>}
          {otherSubmission && <p className="text-xs text-white/40">Their claim: <span className="text-white/70">{otherSubmission.explanation}</span></p>}
        </div>
      )}

      {isCreator && market.status === 'OPEN' && !market.bettorId && (
        <button
          onClick={shareLink}
          className="w-full py-3 rounded-xl border border-white/10 text-white/50 hover:border-white/20 hover:text-white/80 text-sm font-medium transition-colors"
        >
          Share this line →
        </button>
      )}
    </div>
  )
}
