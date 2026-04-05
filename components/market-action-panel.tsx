'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buildVenmoLink, cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface Outcome {
  id: string
  label: string
  odds: number
  isCreatorPick: boolean
}

interface Bet {
  id: string
  amountDollars?: number | null
  venmoUsername?: string | null
}

interface Submission {
  claim: 'WON' | 'LOST'
  explanation: string
}

interface DisputeMessage {
  id: string
  message: string
  createdAt: string
  user: { username?: string | null; name?: string | null }
}

interface Market {
  id: string
  question: string
  status: string
  amountDollars?: number | null
  bettorId?: string | null
  outcomes: Outcome[]
  creator: { id: string; username?: string | null; venmoUsername?: string | null }
  bets?: Bet[]
  dispute?: { id: string; messages?: DisputeMessage[] } | null
}

interface Props {
  market: Market
  userId?: string
  isCreator: boolean
  userBet?: Bet
  mySubmission?: Submission
  otherSubmission?: Submission
  myRating?: { stars: number } | null
  opponentUserId?: string
  userVenmoUsername?: string | null
}

function ShieldIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg className="w-4 h-4 flex-shrink-0 text-[#7C3AED]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 flex-shrink-0 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'text-xl transition-opacity',
            n <= value ? 'opacity-100' : 'opacity-20 hover:opacity-50'
          )}
        >
          ⚡
        </button>
      ))}
    </div>
  )
}

export function MarketActionPanel({
  market,
  userId,
  isCreator,
  userBet,
  mySubmission,
  otherSubmission,
  myRating,
  opponentUserId,
  userVenmoUsername,
}: Props) {
  const router = useRouter()
  const [honorChecked, setHonorChecked] = useState(false)
  const [claim, setClaim] = useState<'WON' | 'LOST' | ''>('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Rating state
  const [ratingStars, setRatingStars] = useState(0)
  const [ratingReview, setRatingReview] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)

  // Dispute message state
  const [disputeMsg, setDisputeMsg] = useState('')
  const [disputeMsgLoading, setDisputeMsgLoading] = useState(false)
  const [disputeActionLoading, setDisputeActionLoading] = useState(false)

  const canBet = market.status === 'OPEN' && !isCreator && !userBet && !!userId
  const canSubmitResult =
    ['CLOSED', 'PENDING_RESULT'].includes(market.status) && (isCreator || !!userBet) && !mySubmission

  const creatorOutcome = market.outcomes.find((o) => o.isCreatorPick)
  const bettorOutcome = market.outcomes.find((o) => !o.isCreatorPick)
  const stakeAmount = market.amountDollars ? Number(market.amountDollars) : null

  const placeBet = async () => {
    if (!bettorOutcome || !honorChecked) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marketId: market.id,
        outcomeId: bettorOutcome.id,
      }),
    })
    if (res.ok) {
      router.push(`/market/${market.id}`)
      router.refresh()
    } else {
      const err = await res.json()
      setError(err.error === 'venmo_required' ? err.message : (err.error ?? 'Something went wrong.'))
      setLoading(false)
    }
  }

  const submitResult = async () => {
    if (!claim) return
    setLoading(true)
    setError('')
    const betId = userBet?.id ?? market.bets?.[0]?.id
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
      setLoading(false)
    }
  }

  const submitRating = async () => {
    if (!ratingStars || !opponentUserId) return
    const betId = userBet?.id ?? market.bets?.[0]?.id
    if (!betId) return
    setRatingLoading(true)
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        betId,
        toUserId: opponentUserId,
        stars: ratingStars,
        review: ratingReview || undefined,
      }),
    })
    if (res.ok) {
      setRatingSubmitted(true)
    }
    setRatingLoading(false)
  }

  const sendDisputeMessage = async () => {
    if (!disputeMsg.trim() || !market.dispute?.id) return
    setDisputeMsgLoading(true)
    await fetch(`/api/disputes/${market.dispute.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: disputeMsg }),
    })
    setDisputeMsg('')
    setDisputeMsgLoading(false)
    router.refresh()
  }

  const resolveDispute = async (action: 'concede' | 'void') => {
    if (!market.dispute?.id) return
    setDisputeActionLoading(true)
    const res = await fetch(`/api/disputes/${market.dispute.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      setDisputeActionLoading(false)
    }
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

      {/* ── Bet panel ──────────────────────────────────────────────── */}
      {canBet && bettorOutcome && creatorOutcome && (() => {
        const takerRisks = stakeAmount && creatorOutcome.odds > 0
          ? stakeAmount * (bettorOutcome.odds / creatorOutcome.odds)
          : null
        const takerWins = stakeAmount

        return (
          <div className="gradient-border p-4 space-y-4">

            {/* Venmo gate */}
            {!userVenmoUsername ? (
              <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/20 rounded-xl px-3 py-2.5">
                <span>⚠️</span>
                <span>Add your Venmo handle on your profile before taking a bet.</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-bold block mb-1">Your Venmo</span>
                  <span className="text-sm text-white/70 font-mono">@{userVenmoUsername}</span>
                </div>
                {takerRisks !== null && takerWins !== null && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-bold block mb-1">Payout</span>
                    <span className="text-xs text-white/40 font-mono">
                      risk <span className="text-white/60">${takerRisks.toFixed(2)}</span>
                      <span className="mx-1 text-white/20">·</span>
                      win <span className="text-[#10B981]/80">${takerWins.toFixed(2)}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Badge of Honor */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-white/25 font-bold">Badge of Honor</p>
              <button
                type="button"
                onClick={() => setHonorChecked(!honorChecked)}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-3 rounded-xl border text-left transition-all',
                  honorChecked
                    ? 'bg-[#7C3AED]/10 border-[#7C3AED]/30'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                )}
              >
                <ShieldIcon filled={honorChecked} />
                <span className="text-xs text-white/60 leading-relaxed">
                  I&apos;m betting in good faith. I&apos;ll report the result honestly, win or lose.
                  JamBets runs on honor — no chargebacks, no excuses.
                </span>
              </button>
            </div>

            {error && <p className="text-[#F43F5E] text-xs">{error}</p>}

            <button
              onClick={placeBet}
              disabled={!honorChecked || loading || !userVenmoUsername}
              className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #10B981)' }}
            >
              {loading ? 'Locking in…' : "I'll Take It →"}
            </button>
          </div>
        )
      })()}

      {/* ── Submit result panel ─────────────────────────────────────── */}
      {canSubmitResult && (
        <div className="gradient-border p-4 space-y-4" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
          <div>
            <p className="font-semibold text-sm mb-0.5">⏰ Truth Time</p>
            <p className="text-xs text-white/40">
              Both parties submit independently. Be honest — your rep depends on it.
            </p>
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
                    ? c === 'WON'
                      ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
                      : 'bg-[#F43F5E]/20 border-[#F43F5E]/40 text-[#F43F5E]'
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
            className="w-full py-3 rounded-xl font-bold text-sm bg-amber-400/20 border border-amber-400/30 text-amber-400 disabled:opacity-40 hover:bg-amber-400/30 transition-colors"
          >
            {loading ? 'Submitting…' : 'Submit My Result'}
          </button>
        </div>
      )}

      {/* ── Waiting on other party ──────────────────────────────────── */}
      {mySubmission && !otherSubmission && (
        <div className="gradient-border p-4 text-center space-y-1">
          <p className="text-sm font-medium">Result submitted ✓</p>
          <p className="text-xs text-white/40">
            You said you {mySubmission.claim === 'WON' ? 'won' : 'lost'}. Waiting on the other party.
          </p>
        </div>
      )}

      {/* ── Settled — Venmo + rate opponent ──────────────────────────── */}
      {market.status === 'SETTLED' && mySubmission?.claim === 'WON' && (() => {
        // Winner charges the loser — txn: 'charge' requests money FROM the loser
        const loserVenmo = isCreator ? userBet?.venmoUsername : market.creator.venmoUsername
        const amountToCollect = isCreator
          ? (userBet?.amountDollars ? Number(userBet.amountDollars) : null)
          : (stakeAmount ?? null)

        return (
          <div className="gradient-border p-4 space-y-4" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
            <div>
              <p className="font-semibold text-[#10B981] text-sm">🎉 You Won!</p>
              <p className="text-xs text-white/40 mt-0.5">Collect your winnings and rate your opponent.</p>
            </div>

            {loserVenmo ? (
              <a
                href={buildVenmoLink({
                  username: loserVenmo,
                  note: `JamBets: ${market.question}`,
                  amount: amountToCollect ?? undefined,
                  txn: 'charge',
                })}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #10B981, #0D9488)' }}
              >
                <div>
                  <span className="text-white/70 font-normal text-xs block mb-0.5">Request via Venmo</span>
                  <span>@{loserVenmo}{amountToCollect ? ` · $${amountToCollect.toFixed(2)}` : ''}</span>
                </div>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              amountToCollect && (
                <p className="text-sm text-[#10B981]/80 font-mono">
                  You&apos;re owed: <span className="text-[#10B981] font-bold">${amountToCollect.toFixed(2)}</span>
                  <span className="text-white/30 ml-2 text-xs">(their Venmo wasn&apos;t provided)</span>
                </p>
              )
            )}

            {opponentUserId && !myRating && !ratingSubmitted && (
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <p className="text-xs text-white/50 font-semibold">Rate your opponent</p>
                <StarRating value={ratingStars} onChange={setRatingStars} />
                <textarea
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                  placeholder="One sentence — good sport? Pay up quickly?"
                  rows={2}
                  maxLength={280}
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors resize-none"
                />
                <button
                  onClick={submitRating}
                  disabled={!ratingStars || ratingLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-sm border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80 disabled:opacity-40 transition-colors"
                >
                  {ratingLoading ? 'Saving…' : 'Submit Rating'}
                </button>
              </div>
            )}
            {ratingSubmitted && (
              <p className="text-xs text-[#10B981]/70 text-center pt-1">Rating submitted ✓</p>
            )}
          </div>
        )
      })()}

      {market.status === 'SETTLED' && mySubmission?.claim === 'LOST' && (() => {
        // Figure out who to pay and how much
        const winnerVenmo = isCreator ? userBet?.venmoUsername : market.creator.venmoUsername
        const amountOwed = isCreator
          ? (stakeAmount ?? null)
          : (userBet?.amountDollars ? Number(userBet.amountDollars) : null)

        return (
          <div className="gradient-border p-4 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div>
              <p className="font-semibold text-white/70 text-sm">You Lost 💸</p>
              <p className="text-xs text-white/30 mt-0.5">Time to pay up. Honor system.</p>
            </div>

            {/* Pay up CTA */}
            {winnerVenmo ? (
              <a
                href={buildVenmoLink({
                  username: winnerVenmo,
                  note: `JamBets: ${market.question}`,
                  amount: amountOwed ?? undefined,
                })}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold text-sm border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07] hover:border-white/20 transition-all"
              >
                <div>
                  <span className="text-white/50 font-normal text-xs block mb-0.5">Pay via Venmo</span>
                  <span>@{winnerVenmo}{amountOwed ? ` · $${amountOwed.toFixed(2)}` : ''}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-white/30" />
              </a>
            ) : (
              amountOwed && (
                <p className="text-sm text-white/60 font-mono">
                  You owe: <span className="text-white font-bold">${amountOwed.toFixed(2)}</span>
                  <span className="text-white/30 ml-2 text-xs">(their Venmo wasn&apos;t provided)</span>
                </p>
              )
            )}

            {/* Rate opponent */}
            {opponentUserId && !myRating && !ratingSubmitted && (
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <p className="text-xs text-white/50 font-semibold">Rate your opponent</p>
                <StarRating value={ratingStars} onChange={setRatingStars} />
                <textarea
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                  placeholder="One sentence — good sport? Pay up quickly?"
                  rows={2}
                  maxLength={280}
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors resize-none"
                />
                <button
                  onClick={submitRating}
                  disabled={!ratingStars || ratingLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-sm border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80 disabled:opacity-40 transition-colors"
                >
                  {ratingLoading ? 'Saving…' : 'Submit Rating'}
                </button>
              </div>
            )}
            {ratingSubmitted && (
              <p className="text-xs text-[#10B981]/70 text-center pt-1">Rating submitted ✓</p>
            )}
          </div>
        )
      })()}

      {/* ── Dispute — resolve panel ──────────────────────────────────── */}
      {market.status === 'DISPUTED' && (
        <div className="gradient-border p-4 space-y-4" style={{ borderColor: 'rgba(244,63,94,0.2)' }}>
          <div>
            <p className="font-semibold text-[#F43F5E] text-sm">⚠️ Disputed</p>
            <p className="text-xs text-white/50 mt-0.5">
              Both parties claimed the same result. Own up or call it a wash.
            </p>
          </div>

          {/* Both submissions */}
          {mySubmission && (
            <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Your claim</p>
              <p className="text-xs text-white/70">{mySubmission.explanation}</p>
            </div>
          )}
          {otherSubmission && (
            <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Their claim</p>
              <p className="text-xs text-white/70">{otherSubmission.explanation}</p>
            </div>
          )}

          {/* Resolve actions — only shown to participants */}
          {(isCreator || !!userBet) && market.dispute?.id && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => resolveDispute('concede')}
                disabled={disputeActionLoading}
                className="py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 text-sm font-semibold hover:border-white/20 hover:text-white/80 disabled:opacity-40 transition-all"
              >
                I Was Wrong
              </button>
              <button
                onClick={() => resolveDispute('void')}
                disabled={disputeActionLoading}
                className="py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/40 text-sm font-semibold hover:border-white/20 hover:text-white/60 disabled:opacity-40 transition-all"
              >
                Void This Bet
              </button>
            </div>
          )}

          {/* Message thread */}
          {market.dispute?.messages && market.dispute.messages.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pt-1 border-t border-white/[0.06]">
              {market.dispute.messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <span className="text-[10px] text-white/30 flex-shrink-0 mt-0.5">
                    @{msg.user.username ?? msg.user.name ?? 'anon'}
                  </span>
                  <p className="text-xs text-white/70">{msg.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Send message */}
          {market.dispute?.id && (
            <div className="flex gap-2">
              <input
                type="text"
                value={disputeMsg}
                onChange={(e) => setDisputeMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendDisputeMessage()}
                placeholder="Say something…"
                maxLength={500}
                className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
              />
              <button
                onClick={sendDisputeMessage}
                disabled={!disputeMsg.trim() || disputeMsgLoading}
                className="px-3 py-2 rounded-lg bg-[#F43F5E]/20 border border-[#F43F5E]/30 text-[#F43F5E] text-sm font-bold disabled:opacity-40 hover:bg-[#F43F5E]/30 transition-colors"
              >
                Send
              </button>
            </div>
          )}

          <p className="text-[10px] text-white/20 text-center">Auto-voids in 24h if unresolved.</p>
        </div>
      )}

      {/* ── Share if creator, no taker yet ─────────────────────────── */}
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
