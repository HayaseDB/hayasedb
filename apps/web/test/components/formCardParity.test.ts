import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const cards = {
  admin: read('../../../admin/app/components/AnimeFormCard.vue'),
  web: read('../../app/components/ContributionFormCard.vue'),
}

describe('anime form card parity', () => {
  it.each(Object.entries(cards))(
    'the %s card derives its baseline from useAnimeFormSession',
    (_name, source) => {
      expect(source).toContain('useAnimeFormSession')
    },
  )

  it.each(Object.entries(cards))(
    'the %s card passes both change props to AnimeForm',
    (_name, source) => {
      expect(source).toContain(':changes="changes"')
      expect(source).toContain(':relation-rows="relationRows"')
    },
  )

  it.each(Object.entries(cards))(
    'the %s card keeps no private dirty tracking',
    (_name, source) => {
      expect(source).not.toContain('useDirtyState')
      expect(source).not.toContain('useFieldChanges')
      expect(source).not.toContain('relation-baseline')
      expect(source).not.toContain('translation-baseline')
    },
  )
})
