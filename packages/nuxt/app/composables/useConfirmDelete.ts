export function useConfirmDelete<T>(action: (item: T) => Promise<boolean>) {
  const target = ref<T | null>(null) as Ref<T | null>
  const deleting = ref(false)

  const open = computed({
    get: () => target.value !== null,
    set: (value) => {
      if (!value) target.value = null
    },
  })

  function ask(item: T) {
    target.value = item
  }

  async function confirm() {
    if (!target.value) return
    deleting.value = true
    try {
      if (await action(target.value)) target.value = null
    } finally {
      deleting.value = false
    }
  }

  return { target, open, deleting, ask, confirm }
}
