import {
  ENTITY_FIELD_META,
  stableStringify,
  type EntityKind,
  type RefTarget,
} from '@hayasedb/domain'

export function diffDocuments(
  prev: Record<string, unknown> | null,
  next: Record<string, unknown>,
): string[] {
  if (!prev) return Object.keys(next)
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
  return [...keys].filter(
    (key) => stableStringify(prev[key]) !== stableStringify(next[key]),
  )
}

export function pickDocumentKeys(
  document: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const picked: Record<string, unknown> = {}
  for (const key of keys) {
    if (key in document) picked[key] = document[key]
  }
  return picked
}

export interface KindedDocument {
  kind: EntityKind
  doc: unknown
}

export function collectDocumentRefs(
  documents: ReadonlyArray<KindedDocument>,
): Record<RefTarget, string[]> {
  const collected = new Map<RefTarget, Set<string>>()

  for (const { kind, doc } of documents) {
    if (!doc || typeof doc !== 'object') continue
    const record = doc as Record<string, unknown>

    for (const [field, meta] of Object.entries(ENTITY_FIELD_META[kind])) {
      if (!meta.ref) continue
      const value = record[field]
      if (!Array.isArray(value)) continue

      const ids = collected.get(meta.ref) ?? new Set<string>()
      for (const item of value) {
        const id =
          meta.refPath === 'self'
            ? item
            : item && typeof item === 'object' && meta.refPath
              ? (item as Record<string, unknown>)[meta.refPath]
              : undefined
        if (typeof id === 'string') ids.add(id)
      }
      collected.set(meta.ref, ids)
    }
  }

  return Object.fromEntries(
    [...collected].map(([target, ids]) => [target, [...ids]]),
  ) as Record<RefTarget, string[]>
}
