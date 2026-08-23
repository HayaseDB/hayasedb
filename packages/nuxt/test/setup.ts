import { getRequestIP } from 'h3'
import { beforeEach, vi } from 'vitest'

export const toast = { add: vi.fn() }

beforeEach(() => toast.add.mockClear())

vi.stubGlobal('useToast', () => toast)
vi.stubGlobal('getRequestIP', getRequestIP)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
vi.stubGlobal('createError', (input: Record<string, unknown>) =>
  Object.assign(new Error(String(input.statusMessage ?? '')), input),
)
vi.stubGlobal('abortNavigation', (error: unknown) => ({ aborted: error }))
vi.stubGlobal('showError', vi.fn())
