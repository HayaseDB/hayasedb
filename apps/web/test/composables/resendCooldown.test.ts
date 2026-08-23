import { type EffectScope, effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useResendCooldown } from '#imports'

let scope: EffectScope

beforeEach(() => {
  vi.useFakeTimers()
  scope = effectScope()
})
afterEach(() => {
  scope.stop()
  vi.useRealTimers()
})

describe('useResendCooldown', () => {
  it('counts down once per second and deactivates at zero', () => {
    const cooldown = scope.run(() => useResendCooldown(3))!
    expect(cooldown.active.value).toBe(false)
    cooldown.start()
    expect(cooldown.remaining.value).toBe(3)
    vi.advanceTimersByTime(2000)
    expect(cooldown.remaining.value).toBe(1)
    expect(cooldown.active.value).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(cooldown.remaining.value).toBe(0)
    expect(cooldown.active.value).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(cooldown.remaining.value).toBe(0)
  })

  it('restarting resets the counter without stacking intervals', () => {
    const cooldown = scope.run(() => useResendCooldown(5))!
    cooldown.start()
    vi.advanceTimersByTime(2000)
    cooldown.start()
    expect(cooldown.remaining.value).toBe(5)
    vi.advanceTimersByTime(1000)
    expect(cooldown.remaining.value).toBe(4)
  })

  it('stops ticking when the scope is disposed', () => {
    const cooldown = scope.run(() => useResendCooldown(10))!
    cooldown.start()
    vi.advanceTimersByTime(1000)
    scope.stop()
    vi.advanceTimersByTime(5000)
    expect(cooldown.remaining.value).toBe(9)
  })
})
