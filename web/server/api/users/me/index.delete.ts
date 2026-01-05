import { z } from 'zod'

const schema = z.object({
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  return await authFetchApi(event, '/users/me', {
    method: 'DELETE',
    body,
  })
})
