import { describe, expect, it } from 'vitest'
import { changeApplyRank } from './contribution.service'

describe('changeApplyRank', () => {
  it('ranks genre writes, then anime creates, then anime edits, then genre deletes', () => {
    const rank = (op: string, entityKind: 'anime' | 'genre') =>
      changeApplyRank({ op, entityKind })
    expect(rank('create', 'genre')).toBe(rank('update', 'genre'))
    expect(rank('create', 'genre')).toBeLessThan(rank('create', 'anime'))
    expect(rank('create', 'anime')).toBeLessThan(rank('update', 'anime'))
    expect(rank('update', 'anime')).toBe(rank('delete', 'anime'))
    expect(rank('delete', 'anime')).toBeLessThan(rank('delete', 'genre'))
  })
})
