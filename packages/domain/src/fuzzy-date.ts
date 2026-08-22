export interface FuzzyDate {
  readonly year: number
  readonly month: number | null
  readonly day: number | null
}

export const FUZZY_DATE_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function fuzzyFromParts(
  year: number | null,
  month: number | null,
  day: number | null,
): FuzzyDate | null {
  return year === null ? null : { year, month, day }
}

export function isoToFuzzy(iso: string): FuzzyDate {
  const [year, month, day] = iso.split('-').map(Number)
  return { year: year!, month: month ?? null, day: day ?? null }
}

export function formatFuzzyDate(date: FuzzyDate | null | undefined): string {
  if (!date) return ''
  if (date.month === null) return String(date.year)
  const month = MONTHS[date.month - 1] ?? String(date.month)
  if (date.day === null) return `${month} ${date.year}`
  return `${month} ${date.day}, ${date.year}`
}

export function fuzzyDateEquals(
  a: FuzzyDate | null | undefined,
  b: FuzzyDate | null | undefined,
): boolean {
  if (!a || !b) return !a && !b
  return a.year === b.year && a.month === b.month && a.day === b.day
}
