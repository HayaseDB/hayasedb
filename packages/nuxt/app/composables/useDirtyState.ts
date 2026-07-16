import { unorderedStringify } from '@hayasedb/domain'

export function useDirtyState<T extends object>(
  state: T,
  createBaseline: () => T,
) {
  const baseline = ref(createBaseline()) as Ref<T>

  const changedFields = computed(() =>
    (Object.keys(baseline.value) as Array<keyof T & string>).filter(
      (key) =>
        unorderedStringify(state[key]) !==
        unorderedStringify(baseline.value[key]),
    ),
  )

  const isDirty = computed(() => changedFields.value.length > 0)

  function reset(next: T = createBaseline()) {
    Object.assign(state, next)
    baseline.value = next
  }

  return { changedFields, isDirty, reset }
}
