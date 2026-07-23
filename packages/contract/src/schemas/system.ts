import * as z from 'zod'

export const systemStatsSchema = z.object({
  anime: z.number().int().min(0),
  contributions: z.number().int().min(0),
  users: z.number().int().min(0),
})

export type SystemStats = z.output<typeof systemStatsSchema>
