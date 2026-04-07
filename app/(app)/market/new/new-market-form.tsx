'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ARTISTS = [
  'Phish', 'Goose', 'Widespread Panic', 'Billy Strings', 'moe.',
  "Umphrey's McGee", 'String Cheese Incident', 'Eggy',
  'Dave Matthews Band', 'King Gizzard and the Lizard Wizard', 'Spafford', 'Other',
]

const PRESETS = [[50, 50], [60, 40], [70, 30], [75, 25]]

interface Outcome {
  id: string
  label: string
  odds: number
  isCreatorPick: boolean
}

const defaultOutcomes: Outcome[] = [
  { id: '1', label: '', odds: 60, isCreatorPick: true },
  { id: '2', label: '', odds: 40, isCreatorPick: false },
]

function adjustOdds(outcomes: Outcome[], id: string, delta: number): Outcome[] {
  const idx = outcomes.findIndex((o) => o.id === id)
  if (idx === -1) return outcomes
  const newOdds = Math.max(5, Math.min(95, outcomes[idx].odds + delta))
  const diff = newOdds - outcomes[idx].odds
  return outcomes.map((o, i) =>
    i === idx ? { ...o, odds: newOdds } : { ...o, odds: Math.max(5, o.odds - diff) }
  )
}

export function NewMarketForm({ initialVenmo }: { initialVenmo?: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [artist, setArtist] = useState('')
  const [customArtist, setCustomArtist] = useState('')
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const [question, setQuestion] = useState('')
  const [rules, setRules] = useState('')
  const [outcomes, setOutcomes] = useState<Outcome[]>(defaultOutcomes)
  const [amountDollars, setAmountDollars] = useState('')
  const [venmo, setVenmo] = useState(initialVenmo ?? '')

  const effectiveArtist = artist === 'Other' ? customArtist : artist
  const showValid = effectiveArtist.trim() && venue.trim() && city.trim() && date
  const totalOdds = outcomes.reduce((s, o) => s + o.odds, 0)
  const oddsValid = totalOdds === 100
  const outcomesValid = outcomes.every((o) => o.label.trim().length > 0)
  const amount = parseFloat(amountDollars)
  const amountValid = !isNaN(amount) && amount >= 1
  const needsVenmo = !initialVenmo
  const venmoValid = !needsVenmo || venmo.trim().length >= 2

  const canSubmit = showValid && question.trim().length >= 5 && rules.trim().length >= 10 && oddsValid && outcomesValid && amountValid && venmoValid

  const creatorOutcome = outcomes.find((o) => o.isCreatorPick)
  const bettorOutcome = outcomes.find((o) => !o.isCreatorPick)

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError('')

    // Save venmo if it wasn't already set
    if (needsVenmo && venmo.trim()) {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venmoUsername: venmo.trim().replace(/^@/, '') }),
      })
    }

    const body = {
      question,
      rules,
      visibility: 'PUBLIC',
      amountDollars: amount,
      outcomes: outcomes.map(({ label, odds, isCreatorPick }) => ({ label, odds, isCreatorPick })),
      manualShow: { artist: effectiveArtist.trim(), venue: venue.trim(), city: city.trim(), date },
    }

    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const { market } = await res.json()
      router.push(`/market/${market.id}?new=1`)
    } else {
      const err = await res.json().catch(() => ({}))
      const errMsg =
        err.error?.formErrors?.[0] ??
        Object.values(err.error?.fieldErrors ?? {}).flat()[0] ??
        (typeof err.error === 'string' ? err.error : null) ??
        'Something went sideways.'
      setError(String(errMsg))
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in pb-36">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a Bet</h1>
        <p className="text-white/40 text-sm mt-1">You set the line. They call it.</p>
      </div>

      {/* Section 1: The Show */}
      <div className="gradient-border p-4 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">The Show</h2>
        <div className="space-y-1">
          <label className="text-xs text-white/50">Artist</label>
          <select
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50 transition-colors appearance-none"
            style={{ colorScheme: 'dark' }}
          >
            <option value="" disabled>Select an artist…</option>
            {ARTISTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {artist === 'Other' && (
          <input
            type="text"
            value={customArtist}
            onChange={(e) => setCustomArtist(e.target.value)}
            placeholder="Artist name"
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
          />
        )}
        <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue (e.g. Madison Square Garden)" className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7C3AED]/50 transition-colors" />
        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (e.g. New York, NY)" className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7C3AED]/50 transition-colors" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50 transition-colors" style={{ colorScheme: 'dark' }} />
      </div>

      {/* Section 2: The Bet */}
      <div className="gradient-border p-4 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">The Bet</h2>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50">The question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will they open with Tweezer? Does Set 2 go over 90 min?"
            rows={2}
            maxLength={280}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/50 transition-colors resize-none leading-relaxed"
          />
          <div className="text-right text-xs transition-colors" style={{ color: question.length > 240 ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}>
            {question.length}/280
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50">Rules &amp; resolution criteria</label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Do teases count? What's the source of truth? Think about how this bet may resolve."
            rows={3}
            maxLength={500}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/50 transition-colors resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Section 3: Your Position */}
      <div className="gradient-border p-4 space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Your Position</h2>
          <p className="text-xs text-white/25 mt-0.5">Set your confidence. The taker gets the other side.</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-white/25">Confidence:</span>
          {PRESETS.map((p, i) => {
            const creatorOdds = outcomes.find((o) => o.isCreatorPick)?.odds
            const active = creatorOdds === p[0]
            return (
              <button
                key={i}
                type="button"
                onClick={() => setOutcomes((prev) => {
                  const ci = prev.findIndex((o) => o.isCreatorPick)
                  return prev.map((o, idx) => ({ ...o, odds: idx === ci ? p[0] : p[1] }))
                })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active ? 'border-[#7C3AED]/50 bg-[#7C3AED]/15 text-white/80' : 'border-white/10 text-white/35 hover:border-white/20 hover:text-white/60'}`}
              >
                {p[0]}/{p[1]}
              </button>
            )
          })}
        </div>
        <div className="space-y-3">
          {outcomes.map((outcome) => (
            <div key={outcome.id} className="flex items-stretch gap-3">
              <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 space-y-1.5">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${outcome.isCreatorPick ? 'text-[#7C3AED]/70' : 'text-white/30'}`}>
                  {outcome.isCreatorPick ? 'My Call' : 'Taker Gets'}
                </span>
                <input
                  type="text"
                  value={outcome.label}
                  onChange={(e) => setOutcomes((prev) => prev.map((o) => o.id === outcome.id ? { ...o, label: e.target.value } : o))}
                  placeholder={outcome.isCreatorPick ? 'e.g. Yes, they open with Tweezer' : "e.g. No, they don't"}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
                />
              </div>
              <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0 w-10">
                <button type="button" onClick={() => setOutcomes((prev) => adjustOdds(prev, outcome.id, 5))} className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/25 transition-colors text-base leading-none">+</button>
                <span className={`text-xs font-mono font-bold tabular-nums text-center w-full ${outcome.isCreatorPick ? 'text-[#7C3AED]/80' : 'text-white/40'}`}>{outcome.odds}%</span>
                <button type="button" onClick={() => setOutcomes((prev) => adjustOdds(prev, outcome.id, -5))} className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/25 transition-colors text-base leading-none">−</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Bet Amount */}
      <div className="gradient-border p-4 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Bet Amount</h2>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm select-none">$</span>
          <input
            type="number"
            value={amountDollars}
            onChange={(e) => setAmountDollars(e.target.value)}
            placeholder="20"
            min="1"
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg pl-6 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
          />
        </div>
      </div>

      {/* Section 5: Venmo — only shown if not already saved */}
      {needsVenmo && (
        <div className="gradient-border p-4 space-y-3 border-amber-400/20">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Your Venmo</h2>
            <p className="text-xs text-white/30 mt-0.5">So your opponent knows where to pay you.</p>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm select-none">@</span>
            <input
              type="text"
              value={venmo}
              onChange={(e) => setVenmo(e.target.value.replace(/^@/, ''))}
              placeholder="your-venmo"
              maxLength={30}
              className="w-full bg-white/[0.06] border border-amber-400/20 rounded-lg pl-6 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/40 transition-colors"
            />
          </div>
        </div>
      )}

      {error && <p className="text-[#F43F5E] text-sm px-1">{error}</p>}

      {/* Sticky footer */}
      <div className="fixed bottom-[64px] left-0 right-0 max-w-lg mx-auto">
        <div className="bg-[#131110] border-t border-white/[0.10] px-4 pt-3 pb-4 space-y-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ background: canSubmit ? 'linear-gradient(135deg, #7C3AED, #10B981)' : 'rgba(255,255,255,0.1)' }}
          >
            {loading ? 'Creating…' : 'Post Your Bet →'}
          </button>

          {amountValid && creatorOutcome && bettorOutcome ? (
            <div className="flex items-center justify-center gap-4 text-xs text-white/40">
              <span>You stake: <span className="text-white/70 font-semibold">${amount.toFixed(2)}</span></span>
              <span className="text-white/20">·</span>
              <span>To win: <span className="text-[#10B981] font-semibold">${(amount * (bettorOutcome.odds / creatorOutcome.odds)).toFixed(2)}</span></span>
            </div>
          ) : (
            <p className="text-center text-[11px] text-white/20">Fill in all fields to post your bet</p>
          )}
        </div>
      </div>
    </div>
  )
}
