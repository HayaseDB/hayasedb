import * as z from 'zod'

export const commonErrors = {
  BAD_REQUEST: { message: 'Invalid request' },
  UNAUTHORIZED: { message: 'Authentication required' },
  FORBIDDEN: { message: 'Insufficient permissions' },
  NOT_FOUND: { message: 'Resource not found' },
  CONFLICT: { message: 'Resource already exists' },
  UNPROCESSABLE_CONTENT: {
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
  TOO_MANY_REQUESTS: { message: 'Too many requests' },
  INTERNAL_SERVER_ERROR: { message: 'Something went wrong' },
} as const
