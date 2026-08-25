<script setup lang="ts">
import { CalendarDate, type DateValue } from '@internationalized/date'
import {
  FUZZY_DATE_MONTHS,
  daysInMonth,
  fuzzyDateEquals,
  type FuzzyDate,
} from '@hayasedb/domain'

type Precision = 'unknown' | 'year' | 'month' | 'day'

const PRECISIONS: Precision[] = ['unknown', 'year', 'month', 'day']

const model = defineModel<FuzzyDate | null>({ default: null })

defineProps<{
  highlight?: boolean
  color?: 'info'
}>()

const precisionItems = [
  { label: 'Unknown', value: 'unknown' },
  { label: 'Year', value: 'year' },
  { label: 'Month', value: 'month' },
  { label: 'Day', value: 'day' },
] satisfies { label: string; value: Precision }[]

const monthItems = FUZZY_DATE_MONTHS.map((label, index) => ({
  label,
  value: index + 1,
}))

function impliedPrecision(value: FuzzyDate | null): Precision {
  if (!value) return 'unknown'
  if (value.day) return 'day'
  if (value.month) return 'month'
  return 'year'
}

const precision = ref<Precision>(impliedPrecision(model.value))

const draft = ref<FuzzyDate | null>(model.value)

let clearingYear = false

function truncate(value: FuzzyDate | null, to: Precision): FuzzyDate | null {
  if (!value || to === 'unknown') return null
  const month = to === 'year' ? null : value.month
  return {
    year: value.year,
    month,
    day: to === 'day' && month ? value.day : null,
  }
}

watch(model, (value, previous) => {
  const implied = impliedPrecision(value)
  if (!value && clearingYear) {
    clearingYear = false
    return
  }
  if (!fuzzyDateEquals(value, truncate(draft.value, precision.value))) {
    draft.value = value
  }
  if (!value || !previous) {
    precision.value = implied
    return
  }
  if (PRECISIONS.indexOf(implied) > PRECISIONS.indexOf(precision.value)) {
    precision.value = implied
  }
})

function commit(next: FuzzyDate | null) {
  draft.value = next
  model.value = truncate(next, precision.value)
}

function setPrecision(value: Precision) {
  clearingYear = false
  precision.value = value
  model.value = truncate(draft.value, value)
}

const year = computed({
  get: () => draft.value?.year ?? null,
  set: (value: number | null) => {
    if (value == null || Number.isNaN(value)) {
      clearingYear = model.value !== null
      draft.value = null
      model.value = null
      return
    }
    const month = draft.value?.month ?? null
    const day = month
      ? Math.min(draft.value?.day ?? 0, daysInMonth(value, month)) || null
      : null
    commit({ year: value, month, day })
  },
})

const month = computed({
  get: () => draft.value?.month ?? null,
  set: (value: number | null) => {
    const current = draft.value
    if (!current) return
    const day =
      value && current.day
        ? Math.min(current.day, daysInMonth(current.year, value))
        : null
    commit({ year: current.year, month: value, day })
  },
})

const calendarDate = computed<DateValue | undefined>({
  get: () => {
    const value = draft.value
    return value?.month && value.day
      ? new CalendarDate(value.year, value.month, value.day)
      : undefined
  },
  set: (value) => {
    commit(
      value ? { year: value.year, month: value.month, day: value.day } : null,
    )
  },
})

const calendarPlaceholder = computed(() => {
  const value = draft.value
  if (!value) return undefined
  return new CalendarDate(value.year, value.month ?? 1, 1)
})

const minDate = new CalendarDate(1, 1, 1)
const maxDate = new CalendarDate(9999, 12, 31)
</script>

<template>
  <div class="flex flex-col gap-2">
    <UTabs
      :model-value="precision"
      :items="precisionItems"
      :content="false"
      size="xs"
      color="neutral"
      @update:model-value="setPrecision($event as Precision)"
    />
    <div v-if="precision === 'year'">
      <UInputNumber
        v-model="year"
        :format-options="{ useGrouping: false }"
        placeholder="Year"
        aria-label="Year"
        :highlight="highlight"
        :color="color"
        class="w-full"
      />
    </div>
    <div v-else-if="precision === 'month'" class="grid grid-cols-2 gap-2">
      <UInputNumber
        v-model="year"
        :format-options="{ useGrouping: false }"
        placeholder="Year"
        aria-label="Year"
        :highlight="highlight"
        :color="color"
      />
      <AppSelect
        v-model="month"
        :items="monthItems"
        :clear-value="null"
        value-key="value"
        placeholder="Month"
        aria-label="Month"
        :disabled="year === null"
        :highlight="highlight"
        :color="color"
      />
    </div>
    <UInputDate
      v-else-if="precision === 'day'"
      v-model="calendarDate"
      :placeholder="calendarPlaceholder"
      :min-value="minDate"
      :max-value="maxDate"
      aria-label="Date"
      :highlight="highlight"
      :color="color"
      class="w-full"
    />
  </div>
</template>
