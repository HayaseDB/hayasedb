import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { useStickyOffset } from '../../app/composables/useStickyOffset'

const Probe = defineComponent({
  setup() {
    const root = ref<HTMLElement | null>(null)
    const offset = useStickyOffset(root)
    return { root, offset }
  },
  render() {
    return h('div', { ref: 'root' }, this.offset)
  },
})

async function mountIn(overflowY: string) {
  const host = document.createElement('div')
  host.style.overflowY = overflowY
  document.body.appendChild(host)
  const wrapper = await mountSuspended(Probe, { attachTo: host })
  return wrapper
}

describe('useStickyOffset', () => {
  it('offsets by the header height when the document scrolls', async () => {
    const wrapper = await mountIn('visible')
    expect(wrapper.text()).toBe('var(--ui-header-height, 0px)')
  })

  it('pins to the container top when an ancestor scrolls', async () => {
    const wrapper = await mountIn('auto')
    expect(wrapper.text()).toBe('0px')
  })
})
