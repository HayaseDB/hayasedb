import { nextTick } from 'vue'
import { vi } from 'vitest'

const macrotask = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

export async function settle(rounds = 4): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await nextTick()
    await macrotask()
  }
}

export async function withFakeTimers(run: () => Promise<void>): Promise<void> {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    await run()
  } finally {
    vi.useRealTimers()
  }
}

export const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms)
