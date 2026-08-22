<script setup lang="ts">
import { CalendarDate, type DateValue } from '@internationalized/date'
import {
  FUZZY_DATE_MONTHS,
  daysInMonth,
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

let clearingYear = false

watch(model, (value, previous) => {
  const implied = impliedPrecision(value)
  if (!value && clearingYear) {
    clearingYear = false
    return
  }
  if (!value || !previous) {
    precision.value = implied
    return
  }
  if (PRECISIONS.indexOf(implied) > PRECISIONS.indexOf(precision.value)) {
    precision.value = implied
  }
})

function setPrecision(value: Precision) {
  clearingYear = false
  precision.value = value
  const current = model.value
  if (value === 'unknown' || !current) {
    model.value = null
    return
  }
  model.value = {
    year: current.year,
    month: value === 'year' ? null : current.month,
    day: value === 'day' ? current.day : null,
  }
}

const year = computed({
  get: () => model.value?.year ?? null,
  set: (value: number | null) => {
    if (value == null || Number.isNaN(value)) {
      clearingYear = model.value !== null
      model.value = null
      return
    }
    const month =
      precision.value === 'year' ? null : (model.value?.month ?? null)
    const day =
      precision.value === 'day' && month
        ? Math.min(model.value?.day ?? 0, daysInMonth(value, month)) || null
        : null
    model.value = { year: value, month, day }
  },
})

const month = computed({
  get: () => model.value?.month ?? null,
  set: (value: number | null) => {
    if (!model.value) return
    model.value = { year: model.value.year, month: value, day: null }
  },
})

const calendarDate = computed<DateValue | undefined>({
  get: () => {
    const value = model.value
    return value?.month && value.day
      ? new CalendarDate(value.year, value.month, value.day)
      : undefined
  },
  set: (value) => {
    model.value = value
      ? { year: value.year, month: value.month, day: value.day }
      : null
  },
})

const calendarPlaceholder = computed(() => {
  const value = model.value
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
