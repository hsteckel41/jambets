'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OddsBuilder } from '@/components/odds-builder'
import { Search, Globe, Lock } from 'lucide-react'

interface Outcome {
  id: string
  label: string
  odds: number
}

const defaultOutcomes: Outcome[] = [
  { id: '1', label: '', odds: 50 },
  { id: '2', label: '', odds: 50 },
]

// Given a show date string, return a datetime-local string defaulting to 7:00 PM that day
function defaultShowtime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T19:00:00')
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T19:00`
  } catch {
    return ''
  }
}

export default function NewMarketPage() {
  const router = useRouter()
  const [step, setStep] = useState<'show' | 'market'>('show')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showSearch, setShowSearch] = useState('')
  const [showResults, setShowResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedShow, setSelectedShow] = useState<any | null>(null)
  const [isManual, setIsManual] = useState(false)
  const [manualShow, setManualShow] = useState({ artist: '', venue: '', city: '', date: '' })

  const [question, setQuestion] = useState('')
  const [window, setWindow] = useState<'PRE_SHOW' | 'SET_BREAK' | 'BOTH'>('PRE_SHOW')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [outcomes, setOutcomes] = useState<Outcome[]>(defaultOutcomes)
  const [preShowClosesAt, setPreShowClosesAt] = useState('')
  const [setBreakClosesAt, setSetBreakClosesAt] = useState('')

  const searchShows = async (q: string) => {
    setShowSearch(q)
    if (q.length < 2) { setShowResults([]); return }
    setSearchLoading(true)
    const res = await fetch(`/api/shows?q=${encodeURIComponent(q)}&upcoming=true`)
    const data = await res.json()
    setShowResults(data.shows ?? [])
    setSearchLoading(false)
  }

  const selectShow = (show: any) => {
    setSelectedShow(show)
    // Auto-populate close time based on show date
    const showDate = show.date ?? show.eventDate ?? ''
    const defaultTime = defaultShowtime(showDate)
    if (defaultTime) {
      setPreShowClosesAt(defaultTime)
      setSetBreakClosesAt(defaultTime)
    }
    setStep('market')
  }

  const totalOdds = outcomes.reduce((s, o) => s + o.odds, 0)
  const oddsValid = totalOdds === 100
  const outcomesValid = outcomes.every((o) => o.label.trim().length > 0)

  const handleSubmit = async () => {
    if (!oddsValid || !outcomesValid) return
    setLoading(true)
    setError('')

    const body: any = {
      question,
      window,
      visibility,
      outcomes: outcomes.map(({ label, odds }) => ({ label, odds })),
      preShowClosesAt: preShowClosesAt || undefined,
      setBreakClosesAt: setBreakClosesAt || undefined,
    }

    if (isManual || selectedShow?.source === 'setlistfm') {
      body.manualShow = isManual ? manualShow : {
        artist: selectedShow.artist,
        venue: selectedShow.venue,
        city: selectedShow.city,
        date: selectedShow.date,
      }
    } else {
      body.showId = selectedShow?.id
    }

    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    try {
      if (res.ok) {
        const { market } = await res.json()
        router.push(`/market/${market.id}`)
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
    } catch {
      setError('Something went sideways.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Header with step indicator */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Write the Line</h1>
          <p className="text-white/40 text-sm mt-1">You set the odds. They call it.</p>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className={`w-6 h-1.5 rounded-full transition-colors ${step === 'show' ? 'bg-[#7C3AED]' : 'bg-[#7C3AED]/60'}`} />
          <div className={`w-6 h-1.5 rounded-full transition-colors ${step === 'market' ? 'bg-[#7C3AED]' : 'bg-white/15'}`} />
        </div>
      </div>

      {/* Step 1: Show picker */}
      {step === 'show' && (
        <div className="space-y-3">
          <div className="gradient-border p-4 space-y-4">
            <div>
              <h2 className="font-semibold text-xs text-white/50 uppercase tracking-wider">Step 1 of 2 — Pick a show</h2>
            </div>

            {!isManual ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={showSearch}
                    onChange={(e) => searchShows(e.target.value)}
                    placeholder="Search Phish, Dead & Co, Goose..."
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
                    autoFocus
                  />
                </div>

                {searchLoading && (
                  <p className="text-xs text-white/30 text-center py-2">Searching...</p>
                )}

                {!searchLoading && showSearch.length >= 2 && showResults.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-2">
                    No shows found.{' '}
                    <button type="button" onClick={() => setIsManual(true)} className="text-[#7C3AED] hover:text-[#7C3AED]/80 underline transition-colors">
                      Enter it manually
                    </button>
                  </p>
                )}

                {showResults.length > 0 && (
                  <div className="space-y-1.5">
                    {showResults.map((show, i) => (
                      <button
                        key={show.id ?? i}
                        type="button"
                        onClick={() => selectShow(show)}
                        className="w-full text-left p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/10 transition-colors"
                      >
                        <p className="font-semibold text-sm">{show.artist}</p>
                        <p className="text-xs text-white/40">{show.venue} · {show.city} · {show.date}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'artist', placeholder: 'Artist (e.g. Phish)' },
                  { key: 'venue', placeholder: 'Venue (e.g. Madison Square Garden)' },
                  { key: 'city', placeholder: 'City (e.g. New York, NY)' },
                ].map(({ key, placeholder }) => (
                  <input
                    key={key}
                    type="text"
                    value={manualShow[key as keyof typeof manualShow]}
                    onChange={(e) => setManualShow((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
                  />
                ))}
                <input
                  type="date"
                  value={manualShow.date}
                  onChange={(e) => setManualShow((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Manual entry CTA — more prominent, outside the card */}
          {!isManual ? (
            <button
              type="button"
              onClick={() => setIsManual(true)}
              className="w-full py-2.5 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
            >
              Can't find it? Enter show manually →
            </button>
          ) : (
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setIsManual(false)}
                className="text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                ← Search instead
              </button>
              <button
                type="button"
                onClick={() => {
                  if (manualShow.artist && manualShow.venue && manualShow.city && manualShow.date) {
                    const show = { ...manualShow, id: null }
                    selectShow(show)
                  }
                }}
                disabled={!manualShow.artist || !manualShow.venue || !manualShow.city || !manualShow.date}
                className="text-sm font-semibold text-[#7C3AED] hover:text-[#7C3AED]/80 disabled:opacity-40 transition-colors"
              >
                Continue →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Market details */}
      {step === 'market' && selectedShow && (
        <div className="space-y-4">
          {/* Selected show — tap to change */}
          <button
            onClick={() => setStep('show')}
            className="w-full gradient-border p-3 flex items-center justify-between text-left group"
          >
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-0.5">Step 2 of 2 — {selectedShow.artist}</p>
              <p className="text-sm font-semibold text-white">{selectedShow.venue} · {selectedShow.city}</p>
            </div>
            <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">Change</span>
          </button>

          {/* Question */}
          <div className="gradient-border p-4 space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">The Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will they open with Tweezer? Does Set 2 go over 90 min? Bust-out incoming?"
              rows={3}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none resize-none leading-relaxed"
              maxLength={280}
              autoFocus
            />
            <div className="text-xs text-right transition-colors" style={{ color: question.length > 250 ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}>
              {question.length}/280
            </div>
          </div>

          {/* Odds */}
          <div className="gradient-border p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">The Odds</label>
              <p className="text-xs text-white/30 mt-0.5">You're the oddsmaker. Hit +/− to adjust the split.</p>
            </div>
            <OddsBuilder value={outcomes} onChange={setOutcomes} />
          </div>

          {/* Closing window */}
          <div className="gradient-border p-4 space-y-3">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">When does it close?</label>
            <div className="grid grid-cols-3 gap-2">
              {(['PRE_SHOW', 'SET_BREAK', 'BOTH'] as const).map((w) => {
                const labels = { PRE_SHOW: 'Pre-show', SET_BREAK: 'Set break', BOTH: 'Both' }
                const descs = { PRE_SHOW: 'Closes at doors', SET_BREAK: 'Open at intermission', BOTH: 'Both windows' }
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWindow(w)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      window === w
                        ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-white'
                        : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:border-white/20'
                    }`}
                  >
                    <p className="text-xs font-semibold">{labels[w]}</p>
                    <p className="text-[10px] mt-0.5 text-white/40">{descs[w]}</p>
                  </button>
                )
              })}
            </div>
            {(window === 'PRE_SHOW' || window === 'BOTH') && (
              <div>
                <label className="text-[11px] text-white/40">Closes at (pre-show)</label>
                <input type="datetime-local" value={preShowClosesAt} onChange={(e) => setPreShowClosesAt(e.target.value)}
                  className="mt-1 w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50 transition-colors" />
              </div>
            )}
            {(window === 'SET_BREAK' || window === 'BOTH') && (
              <div>
                <label className="text-[11px] text-white/40">Closes at (set break)</label>
                <input type="datetime-local" value={setBreakClosesAt} onChange={(e) => setSetBreakClosesAt(e.target.value)}
                  className="mt-1 w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50 transition-colors" />
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="gradient-border p-4 space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Who can see it?</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: 'PUBLIC' as const, Icon: Globe, label: 'Public', desc: 'Appears in the global feed' },
                { v: 'PRIVATE' as const, Icon: Lock, label: 'Private', desc: 'Share a link to invite' },
              ]).map(({ v, Icon, label, desc }) => (
                <button key={v} type="button" onClick={() => setVisibility(v)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    visibility === v
                      ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-white'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="w-3.5 h-3.5" />
                    <p className="text-sm font-semibold">{label}</p>
                  </div>
                  <p className="text-[11px] text-white/40">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-[#F43F5E] text-sm">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!oddsValid || !outcomesValid || !question.trim() || loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity glow-purple"
            style={{background: 'linear-gradient(135deg, #7C3AED, #4F46E5)'}}
          >
            {loading ? 'Posting...' : 'Post the Line →'}
          </button>
        </div>
      )}
    </div>
  )
}
