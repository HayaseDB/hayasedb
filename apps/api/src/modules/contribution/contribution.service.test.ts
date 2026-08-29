import { describe, expect, it } from 'vitest'
import { changeApplyRank } from './contribution.service'

describe('changeApplyRank', () => {
  it('creates parents first and deletes children first', () => {
    const rank = (op: string, entityKind: 'anime' | 'genre') =>
      changeApplyRank({ op, entityKind })
    expect(rank('create', 'genre')).toBeLessThan(rank('create', 'anime'))
    expect(rank('delete', 'anime')).toBeLessThan(rank('delete', 'genre'))
  })
})
