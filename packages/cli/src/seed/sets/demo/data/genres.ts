import type { LocalizationLocale } from '@hayasedb/domain'

export interface SeedGenreEntry {
  name: string
  translations: { locale: LocalizationLocale; name: string }[]
}

export const SEED_GENRES = [
  { name: 'Action', ja: 'アクション', de: 'Action', fr: 'Action' },
  { name: 'Adventure', ja: '冒険', de: 'Abenteuer', fr: 'Aventure' },
  { name: 'Comedy', ja: 'コメディ', de: 'Komödie', fr: 'Comédie' },
  { name: 'Drama', ja: 'ドラマ', de: 'Drama', fr: 'Drame' },
  { name: 'Fantasy', ja: 'ファンタジー', de: 'Fantasy', fr: 'Fantastique' },
  { name: 'Horror', ja: 'ホラー', de: 'Horror', fr: 'Horreur' },
  { name: 'Mecha', ja: 'メカ', de: 'Mecha', fr: 'Mecha' },
  { name: 'Mystery', ja: 'ミステリー', de: 'Mystery', fr: 'Mystère' },
  {
    name: 'Psychological',
    ja: '心理',
    de: 'Psychothriller',
    fr: 'Psychologique',
  },
  { name: 'Romance', ja: 'ロマンス', de: 'Romantik', fr: 'Romance' },
  { name: 'Sci-Fi', ja: 'SF', de: 'Science-Fiction', fr: 'Science-fiction' },
  {
    name: 'Slice of Life',
    ja: '日常',
    de: 'Alltagsdrama',
    fr: 'Tranche de vie',
  },
  { name: 'Sports', ja: 'スポーツ', de: 'Sport', fr: 'Sport' },
  { name: 'Supernatural', ja: '超自然', de: 'Übernatürlich', fr: 'Surnaturel' },
  { name: 'Thriller', ja: 'スリラー', de: 'Thriller', fr: 'Thriller' },
].map(({ name, ja, de, fr }): SeedGenreEntry => ({
  name,
  translations: [
    { locale: 'en', name },
    { locale: 'ja-Jpan', name: ja },
    { locale: 'de', name: de },
    { locale: 'fr', name: fr },
  ],
}))

export const SEED_GENRE_NAMES = SEED_GENRES.map((genre) => genre.name)
