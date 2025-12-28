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

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled
}
