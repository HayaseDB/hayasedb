import { describe, expect, it } from 'vitest'
import {
  buildRequirements,
  deselectValue,
  flattenTree,
  selectValue,
  toggleValue,
  type TreeNode,
} from './tree-prompt'

const TREE: TreeNode[] = [
  {
    value: 'users',
    label: 'users',
    children: [
      { value: 'avatars', label: 'avatars' },
      { value: 'api-keys', label: 'api-keys' },
    ],
  },
  { value: 'genres', label: 'genres' },
  {
    value: 'anime',
    label: 'anime',
    children: [
      { value: 'relations', label: 'relations' },
      { value: 'contributions', label: 'contributions' },
    ],
  },
]

const requirements = buildRequirements(TREE)

describe('flattenTree', () => {
  it('keeps depth-first order and marks branches', () => {
    const flat = flattenTree(TREE)
    expect(flat.map((node) => node.value)).toEqual([
      'users',
      'avatars',
      'api-keys',
      'genres',
      'anime',
      'relations',
      'contributions',
    ])
    expect(flat[0]?.branch).toBe('')
    expect(flat[1]?.branch).toBe('├─ ')
    expect(flat[2]?.branch).toBe('└─ ')
  })
})

describe('buildRequirements', () => {
  it('derives requirements from the tree and merges extras', () => {
    expect(requirements.get('users')).toEqual([])
    expect(requirements.get('avatars')).toEqual(['users'])
    const withExtra = buildRequirements(TREE, { contributions: ['users'] })
    expect(new Set(withExtra.get('contributions'))).toEqual(
      new Set(['users', 'anime']),
    )
  })
})

describe('selectValue', () => {
  it('auto-selects required ancestors', () => {
    const selected = selectValue(new Set(), 'relations', requirements)
    expect(selected).toEqual(new Set(['relations', 'anime']))
  })

  it('follows extra requirements transitively', () => {
    const withExtra = buildRequirements(TREE, { contributions: ['users'] })
    const selected = selectValue(new Set(), 'contributions', withExtra)
    expect(selected).toEqual(new Set(['contributions', 'anime', 'users']))
  })
})

describe('deselectValue', () => {
  it('cascades to dependents', () => {
    const all = new Set([
      'users',
      'avatars',
      'api-keys',
      'genres',
      'anime',
      'relations',
      'contributions',
    ])
    const selected = deselectValue(all, 'anime', requirements)
    expect(selected).toEqual(
      new Set(['users', 'avatars', 'api-keys', 'genres']),
    )
  })

  it('leaves unrelated selections alone', () => {
    const selected = deselectValue(
      new Set(['users', 'avatars', 'genres']),
      'avatars',
      requirements,
    )
    expect(selected).toEqual(new Set(['users', 'genres']))
  })
})

describe('toggleValue', () => {
  it('round-trips select and deselect', () => {
    const on = toggleValue(new Set(), 'contributions', requirements)
    expect(on).toEqual(new Set(['contributions', 'anime']))
    const off = toggleValue(on, 'anime', requirements)
    expect(off).toEqual(new Set())
  })
})
