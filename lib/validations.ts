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
  rules: z.string().min(10, 'Rules must be at least 10 characters').max(500),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  amountDollars: z.number().positive().min(1, 'Bet amount must be at least $1'),
  outcomes: z.array(z.object({
    label: z.string().min(1).max(100),
    odds: z.number().int().min(1).max(98),
    isCreatorPick: z.boolean(),
  })).length(2, 'Exactly 2 outcomes required'),
}).refine(
  (data) => {
    const total = data.outcomes.reduce((sum, o) => sum + o.odds, 0)
    return total === 100
  },
  { message: 'Odds must add up to exactly 100%', path: ['outcomes'] }
).refine(
  (data) => {
    const picks = data.outcomes.filter((o) => o.isCreatorPick)
    return picks.length === 1
  },
  { message: 'Exactly one outcome must be marked as creator pick', path: ['outcomes'] }
).refine(
  (data) => data.showId || data.manualShow,
  { message: 'Either select a show or enter one manually', path: ['showId'] }
)

export const placeBetSchema = z.object({
  marketId: z.string(),
  outcomeId: z.string(),
  venmoUsername: z.string().min(1).optional(),
})

export const submitResultSchema = z.object({
  betId: z.string(),
  claim: z.enum(['WON', 'LOST']),
  explanation: z.string().min(5).max(280),
})

export const usernameSchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})
