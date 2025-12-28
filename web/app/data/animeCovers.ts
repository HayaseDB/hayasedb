export interface AnimeCover {
  id: number
  title: string
  image: string
}

export const animeCovers: AnimeCover[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `Anime ${i + 1}`,
  image: `https://picsum.photos/seed/anime${i + 1}/300/450`,
}))

function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffleArray<T>(array: T[], seed = 42): T[] {
  const random = seededRandom(seed)
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled
}
