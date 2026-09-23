import { sameFieldValue } from '@hayasedb/domain'
import type { FieldMeta } from '@hayasedb/domain'

export type ChangePath = string

export interface ChangeSet {
  readonly topLevel: ReadonlySet<string>
  readonly paths: ReadonlySet<ChangePath>
  readonly isDirty: boolean
}

export const EMPTY_CHANGE_SET: ChangeSet = {
  topLevel: new Set<string>(),
  paths: new Set<ChangePath>(),
  isDirty: false,
}

export function useFieldChanges<T extends object>(options: {
  state: T
  baseline: () => T
  meta?: Readonly<Record<string, FieldMeta>>
  expand?: {
    [K in keyof T & string]?: (next: T[K], base: T[K]) => ChangePath[]
  }
  enabled?: () => boolean
  initial?: () => T
}) {
  const { state, baseline: createBaseline, meta, expand, enabled } = options
  const createInitial = options.initial ?? createBaseline

  const baseline = ref(createBaseline()) as Ref<T>

  const changedFields = computed<Array<keyof T & string>>(() => {
    const keys = Object.keys(baseline.value) as Array<keyof T & string>
    if (!meta) {
      return keys.filter(
        (key) => !sameFieldValue(state[key], baseline.value[key]),
      )
    }
    return keys.filter((key) => {
      const fieldMeta = meta[key]
      return !sameFieldValue(
        state[key],
        baseline.value[key],
        fieldMeta,
        fieldMeta?.parts?.positional,
      )
    })
  })

  const changes = computed<ChangeSet>(() => {
    if (enabled && !enabled()) return EMPTY_CHANGE_SET

    const topLevel = new Set<string>(changedFields.value)
    const paths = new Set<ChangePath>(topLevel)

    if (expand) {
      for (const key of topLevel) {
        const expandKey = expand[key as keyof T & string]
        if (!expandKey) continue
        const typedKey = key as keyof T & string
        const nested = expandKey(state[typedKey], baseline.value[typedKey])
        for (const path of nested) paths.add(`${key}.${path}`)
      }
    }

    return { topLevel, paths, isDirty: topLevel.size > 0 }
  })

  const isDirty = computed(() => changedFields.value.length > 0)

  function reset() {
    Object.assign(state, createInitial())
    baseline.value = createBaseline()
  }

  return { changes, changedFields, isDirty, baseline, reset }
}
