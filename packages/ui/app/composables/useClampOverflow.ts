import { useResizeObserver } from '@vueuse/core'

export function useClampOverflow(
  target: Readonly<Ref<HTMLElement | null>>,
  expanded: Readonly<Ref<boolean>>,
) {
  const clamped = ref(false)

  useResizeObserver(target, () => {
    if (expanded.value) return
    const el = target.value
    if (el) clamped.value = el.scrollHeight - el.clientHeight > 1
  })

  return clamped
}
