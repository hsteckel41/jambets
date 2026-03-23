'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Plus, Minus, X } from 'lucide-react'

interface Outcome {
  id: string
  label: string
  odds: number
}

interface OddsBuilderProps {
  value: Outcome[]
  onChange: (outcomes: Outcome[]) => void
  maxOutcomes?: number
}

const COLORS = [
  'from-[#7C3AED] to-[#4F46E5]',
  'from-[#10B981] to-[#0D9488]',
  'from-[#F59E0B] to-[#F97316]',
  'from-[#F43F5E] to-[#EC4899]',
  'from-[#0EA5E9] to-[#3B82F6]',
  'from-[#84CC16] to-[#10B981]',
]

const PRESETS_2 = [[50, 50], [60, 40], [70, 30], [75, 25]]

export function OddsBuilder({ value: outcomes, onChange, maxOutcomes = 6 }: OddsBuilderProps) {
  const total = outcomes.reduce((s, o) => s + o.odds, 0)
  const isValid = total === 100

  const addOutcome = () => {
    if (outcomes.length >= maxOutcomes) return
    const newOdds = Math.max(5, Math.min(100 - total, 10))
    onChange([...outcomes, { id: crypto.randomUUID(), label: '', odds: newOdds }])
  }

  const removeOutcome = (id: string) => {
    if (outcomes.length <= 2) return
    onChange(outcomes.filter((o) => o.id !== id))
  }

  const updateLabel = (id: string, label: string) => {
    onChange(outcomes.map((o) => (o.id === id ? { ...o, label } : o)))
  }

  const adjustOdds = (id: string, delta: number) => {
    const idx = outcomes.findIndex((o) => o.id === id)
    if (idx === -1) return
    const current = outcomes[idx].odds
    const newOdds = Math.max(1, Math.min(98, current + delta))
    if (newOdds === current) return

    const diff = newOdds - current
    const others = outcomes.filter((_, i) => i !== idx)
    const othersTotal = others.reduce((s, o) => s + o.odds, 0)

    const updated = outcomes.map((o, i) => {
      if (i === idx) return { ...o, odds: newOdds }
      if (othersTotal === 0) return o
      const share = Math.round((o.odds / othersTotal) * -diff)
      return { ...o, odds: Math.max(1, o.odds + share) }
    })

    const newTotal = updated.reduce((s, o) => s + o.odds, 0)
    if (newTotal !== 100) {
      const fixIdx = updated.findIndex((_, i) => i !== idx)
      if (fixIdx !== -1) updated[fixIdx] = { ...updated[fixIdx], odds: updated[fixIdx].odds + (100 - newTotal) }
    }

    onChange(updated)
  }

  const applyPreset = (preset: number[]) => {
    onChange(outcomes.slice(0, preset.length).map((o, i) => ({ ...o, odds: preset[i] })))
  }

  return (
    <div className="space-y-3">
      {outcomes.length === 2 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-white/30">Quick split:</span>
          {PRESETS_2.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-white/50 hover:border-white/20 hover:text-white/80 transition-colors"
            >
              {p[0]}/{p[1]}
            </button>
          ))}
        </div>
      )}

      {/* Visual bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px bg-white/5">
        {outcomes.map((o, i) => (
          <div
            key={o.id}
            className={cn('bg-gradient-to-r transition-all duration-200', COLORS[i % COLORS.length])}
            style={{ width: `${(o.odds / Math.max(total, 100)) * 100}%` }}
          />
        ))}
      </div>

      {/* Outcome rows */}
      <div className="space-y-2">
        {outcomes.map((outcome, i) => (
          <div key={outcome.id} className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full flex-shrink-0 bg-gradient-to-r', COLORS[i % COLORS.length])} />
            <input
              type="text"
              value={outcome.label}
              onChange={(e) => updateLabel(outcome.id, e.target.value)}
              placeholder={i === 0 ? 'e.g. Yes' : i === 1 ? 'e.g. No' : `Option ${i + 1}`}
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7C3AED]/50 focus:bg-white/[0.08] transition-colors"
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => adjustOdds(outcome.id, -5)}
                className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-10 text-center text-sm font-mono font-semibold text-white tabular-nums">
                {outcome.odds}%
              </span>
              <button
                type="button"
                onClick={() => adjustOdds(outcome.id, 5)}
                className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {outcomes.length > 2 && (
              <button
                type="button"
                onClick={() => removeOutcome(outcome.id)}
                className="w-7 h-7 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {outcomes.length < maxOutcomes ? (
          <button
            type="button"
            onClick={addOutcome}
            className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add outcome
          </button>
        ) : <span />}

        <div className={cn(
          'text-sm font-mono font-semibold tabular-nums transition-colors',
          isValid ? 'text-[#10B981]' : total > 100 ? 'text-[#F43F5E]' : 'text-[#F59E0B]'
        )}>
          {total}/100%
          {isValid && <span className="ml-1.5 text-xs font-sans font-normal"> ✓ locked in</span>}
          {total > 100 && <span className="ml-1.5 text-xs font-sans text-[#F43F5E]"> over by {total - 100}%</span>}
          {total < 100 && total > 0 && <span className="ml-1.5 text-xs font-sans text-white/30"> {100 - total}% left</span>}
        </div>
      </div>
    </div>
  )
}
