import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import type { FuzzyDate } from '@hayasedb/domain'
import AnimeFuzzyDateInput from '../../app/components/anime/AnimeFuzzyDateInput.vue'

async function mount(initial: FuzzyDate | null) {
  const value = ref(initial)
  const wrapper = await mountSuspended(AnimeFuzzyDateInput, {
    props: {
      modelValue: value.value,
      'onUpdate:modelValue': (next: FuzzyDate | null) => {
        value.value = next
      },
    },
  })
  const selectedTab = () =>
    wrapper.find('[role="tab"][aria-selected="true"]').text()
  const clickTab = async (label: string) => {
    const tab = wrapper
      .findAll('[role="tab"]')
      .find((el) => el.text() === label)!
    await tab.trigger('mousedown', { button: 0 })
    await tab.trigger('click')
    await wrapper.vm.$nextTick()
  }
  return { wrapper, value, selectedTab, clickTab }
}

describe('AnimeFuzzyDateInput', () => {
  it('derives the precision tab from the model', async () => {
    expect((await mount(null)).selectedTab()).toBe('Unknown')
    expect(
      (await mount({ year: 2020, month: null, day: null })).selectedTab(),
    ).toBe('Year')
    expect(
      (await mount({ year: 2020, month: 4, day: null })).selectedTab(),
    ).toBe('Month')
    expect((await mount({ year: 2020, month: 4, day: 9 })).selectedTab()).toBe(
      'Day',
    )
  })

  it('lowering precision truncates the model without dropping the year', async () => {
    const { value, clickTab, selectedTab } = await mount({
      year: 2020,
      month: 4,
      day: 9,
    })
    await clickTab('Month')
    expect(selectedTab()).toBe('Month')
    expect(value.value).toEqual({ year: 2020, month: 4, day: null })
    await clickTab('Year')
    expect(value.value).toEqual({ year: 2020, month: null, day: null })
    await clickTab('Unknown')
    expect(value.value).toBeNull()
  })

  it('raising precision keeps the model until a finer value is picked', async () => {
    const { wrapper, value, clickTab } = await mount({
      year: 2020,
      month: null,
      day: null,
    })
    await clickTab('Month')
    expect(value.value).toEqual({ year: 2020, month: null, day: null })
    expect(wrapper.find('[aria-label="Month"]').exists()).toBe(true)
    await clickTab('Day')
    expect(value.value).toEqual({ year: 2020, month: null, day: null })
    expect(wrapper.find('[aria-label="Date"]').exists()).toBe(true)
  })

  it('restores hidden parts when the precision is raised again', async () => {
    const { value, clickTab } = await mount({ year: 2020, month: 4, day: 9 })
    await clickTab('Month')
    expect(value.value).toEqual({ year: 2020, month: 4, day: null })
    await clickTab('Day')
    expect(value.value).toEqual({ year: 2020, month: 4, day: 9 })
    await clickTab('Year')
    expect(value.value).toEqual({ year: 2020, month: null, day: null })
    await clickTab('Day')
    expect(value.value).toEqual({ year: 2020, month: 4, day: 9 })
  })

  it('restores parts after a round trip through Unknown', async () => {
    const { value, clickTab } = await mount({ year: 2020, month: 4, day: 9 })
    await clickTab('Unknown')
    expect(value.value).toBeNull()
    await clickTab('Day')
    expect(value.value).toEqual({ year: 2020, month: 4, day: 9 })
  })

  it('drops the remembered day when an external value replaces it', async () => {
    const { wrapper, value, clickTab } = await mount({
      year: 2020,
      month: 4,
      day: 9,
    })
    await wrapper.setProps({ modelValue: { year: 1999, month: 7, day: null } })
    await clickTab('Day')
    expect(value.value).toEqual({ year: 1999, month: 7, day: null })
  })

  it('follows an external model upgrade but not a downgrade', async () => {
    const { wrapper, selectedTab } = await mount({
      year: 2020,
      month: null,
      day: null,
    })
    await wrapper.setProps({ modelValue: { year: 2020, month: 4, day: 9 } })
    expect(selectedTab()).toBe('Day')
    await wrapper.setProps({ modelValue: { year: 2020, month: 4, day: null } })
    expect(selectedTab()).toBe('Day')
  })
})
