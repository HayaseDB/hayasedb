import { isoToFuzzy } from './fuzzy-date'
import { stableStringify, unorderedStringify } from './stable-stringify'
import type { FieldMeta } from './field-meta'

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

function withoutKeys(item: unknown, keys?: readonly string[]): unknown {
  if (!keys?.length || !item || typeof item !== 'object') return item
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
    if (!keys.includes(key)) rest[key] = value
  }
  return rest
}

function isEmptyLocalizedRow(row: unknown): boolean {
  if (!row || typeof row !== 'object') return true
  return Object.entries(row as Record<string, unknown>).every(
    ([key, value]) => key === 'locale' || isEmptyValue(value),
  )
}

export function fieldIdentity(
  value: unknown,
  meta?: FieldMeta,
  positional?: readonly string[],
): string {
  if (isEmptyValue(value)) return 'null'

  if (meta?.as === 'fuzzydate' && typeof value === 'string') {
    const parsed = isoToFuzzy(value)
    if (Number.isFinite(parsed.year)) return stableStringify(parsed)
  }

  if (meta?.as === 'localized' && Array.isArray(value)) {
    const rows = value.filter((row) => !isEmptyLocalizedRow(row))
    return rows.length === 0 ? 'null' : unorderedStringify(rows)
  }

  if (meta?.unordered) return unorderedStringify(value)

  const isSingleton = !Array.isArray(value) || value.length <= 1
  if (positional?.length && isSingleton) {
    const stripped = Array.isArray(value)
      ? value.map((item) => withoutKeys(item, positional))
      : value
    return stableStringify(stripped)
  }
  return stableStringify(value)
}

export function sameFieldValue(
  a: unknown,
  b: unknown,
  meta?: FieldMeta,
  positional?: readonly string[],
): boolean {
  return (
    fieldIdentity(a, meta, positional) === fieldIdentity(b, meta, positional)
  )
}

export function changedFieldKeys<K extends string>(
  next: Readonly<Partial<Record<K, unknown>>>,
  baseline: Readonly<Partial<Record<K, unknown>>>,
  meta: Readonly<Record<string, FieldMeta>>,
  order: readonly K[],
): K[] {
  return order.filter((key) => {
    const fieldMeta = meta[key]
    return !sameFieldValue(
      next[key],
      baseline[key],
      fieldMeta,
      fieldMeta?.parts?.positional,
    )
  })
}
