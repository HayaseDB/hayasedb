import { useEventListener, useResizeObserver } from '@vueuse/core'

function hasScrollAncestor(el: HTMLElement): boolean {
  let node = el.parentElement
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return true
    node = node.parentElement
  }
  return false
}

export function useStickyOffset(target: Readonly<Ref<HTMLElement | null>>) {
  const scoped = ref(false)

  function measure() {
    const el = target.value
    if (!el || typeof getComputedStyle !== 'function') return
    scoped.value = hasScrollAncestor(el)
  }

  onMounted(measure)
  watch(target, measure)
  useResizeObserver(target, measure)
  useEventListener('resize', measure)

  return computed(() => (scoped.value ? '0px' : 'var(--ui-header-height, 0px)'))
}
