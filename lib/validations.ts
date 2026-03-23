import { z } from 'zod'

export const createMarketSchema = z.object({
  showId: z.string().optional(),
  manualShow: z.object({
    artist: z.string().min(1),
    venue: z.string().min(1),
    city: z.string().min(1),
    date: z.string(),
  }).optional(),
  question: z.string().min(5).max(280),
  window: z.enum(['PRE_SHOW', 'SET_BREAK', 'BOTH']),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  preShowClosesAt: z.string().optional(),
  setBreakClosesAt: z.string().optional(),
  outcomes: z.array(z.object({
    label: z.string().min(1).max(100),
    odds: z.number().int().min(1).max(98),
  })).min(2).max(6),
}).refine(
  (data) => {
    const total = data.outcomes.reduce((sum, o) => sum + o.odds, 0)
    return total === 100
  },
  { message: 'Odds must add up to exactly 100%', path: ['outcomes'] }
).refine(
  (data) => data.showId || data.manualShow,
  { message: 'Either select a show or enter one manually', path: ['showId'] }
)

export const placeBetSchema = z.object({
  marketId: z.string(),
  outcomeId: z.string(),
  amountDollars: z.number().positive().optional(),
  venmoUsername: z.string().min(1).optional(),
})

export const submitResultSchema = z.object({
  betId: z.string(),
  claim: z.enum(['WON', 'LOST']),
  explanation: z.string().min(5).max(280),
})
