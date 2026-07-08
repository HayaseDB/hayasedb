import * as z from 'zod'

export const commonErrors = {
  UNAUTHORIZED: { message: 'Authentication required' },
  FORBIDDEN: { message: 'Insufficient permissions' },
  NOT_FOUND: { message: 'Resource not found' },
  CONFLICT: { message: 'Resource already exists' },
  INPUT_VALIDATION_FAILED: {
    message: 'Invalid input',
    data: z.object({
      issues: z.array(
        z.object({
          path: z.array(z.union([z.string(), z.number()])),
          message: z.string(),
        }),
      ),
    }),
  },
  INTERNAL_SERVER_ERROR: { message: 'Something went wrong' },
} as const
