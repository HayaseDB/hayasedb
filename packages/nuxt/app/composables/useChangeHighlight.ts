import type { InjectionKey, MaybeRefOrGetter } from 'vue'
import type { ChangeSet, ChangePath } from './useFieldChanges'

export type ChangeKind = 'unchanged' | 'changed' | 'added' | 'removed'

interface ChangeScope {
  kindOf: (path: ChangePath) => ChangeKind
}

const CHANGE_SCOPE_KEY = Symbol(
  'hayasedb.changeScope',
) as InjectionKey<ChangeScope>

const INERT_SCOPE: ChangeScope = { kindOf: () => 'unchanged' }

export function provideChangeScope(options: {
  changes: MaybeRefOrGetter<ChangeSet>
  kinds?: MaybeRefOrGetter<ReadonlyMap<string, ChangeKind> | undefined>
}): void {
  const changes = computed(() => toValue(options.changes))
  const kinds = computed(() => toValue(options.kinds))

  provide(CHANGE_SCOPE_KEY, {
    kindOf: (path) =>
      kinds.value?.get(path) ??
      (changes.value?.paths?.has(path) ? 'changed' : 'unchanged'),
  })
}

export function useChangeScope(prefix?: MaybeRefOrGetter<string | undefined>) {
  const parent = inject(CHANGE_SCOPE_KEY, INERT_SCOPE)

  const scope: ChangeScope = {
    kindOf: (path) => {
      const at = toValue(prefix)
      return parent.kindOf(at ? `${at}.${path}` : path)
    },
  }
  return scope
}

export function provideNestedChangeScope(
  prefix: MaybeRefOrGetter<string | undefined>,
) {
  const scope = useChangeScope(prefix)
  provide(CHANGE_SCOPE_KEY, scope)
  return scope
}
