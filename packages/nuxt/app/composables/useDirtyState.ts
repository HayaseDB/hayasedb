function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).sort().join(',')}]`
  }
  return JSON.stringify(value)
}

export function useDirtyState<T extends Record<string, unknown>>(
  state: T,
  createBaseline: () => T,
) {
  const baseline = ref(createBaseline()) as Ref<T>

  const changedFields = computed(() =>
    (Object.keys(baseline.value) as Array<keyof T>).filter(
      (key) =>
        stableStringify(state[key]) !== stableStringify(baseline.value[key]),
    ),
  )

  const isDirty = computed(() => changedFields.value.length > 0)

  function reset(next: T = createBaseline()) {
    Object.assign(state, next)
    baseline.value = next
  }

  return { changedFields, isDirty, reset }
}
