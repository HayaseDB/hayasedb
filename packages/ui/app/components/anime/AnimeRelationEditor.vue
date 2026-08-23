<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import type { AnimeRelationViewKind } from '@hayasedb/domain'
import type { AnimeRelationEdgeItem, AnimeRelationSearchResult } from '#imports'

const model = defineModel<AnimeRelationEdgeItem[]>({ required: true })

const props = defineProps<{
  selfId: string | null
  searchAnime: (query: string) => Promise<AnimeRelationSearchResult[]>
  baseline?: AnimeRelationEdgeItem[]
}>()

const baselineKeys = computed(
  () => new Set((props.baseline ?? []).map(relationEdgeKey)),
)

type RelationRowState = 'unchanged' | 'added' | 'changed' | 'removed'

interface RelationRow {
  state: RelationRowState
  edge: AnimeRelationEdgeItem
  order: number
}

const rows = computed<RelationRow[]>(() => {
  const baseline = props.baseline
  if (baseline === undefined) {
    return model.value.map((edge: AnimeRelationEdgeItem, index: number) => ({
      state: 'unchanged',
      edge,
      order: index,
    }))
  }
  const consumed = new Set<string>()
  const list: RelationRow[] = []
  baseline.forEach((base: AnimeRelationEdgeItem, index: number) => {
    const exact = model.value.find(
      (edge: AnimeRelationEdgeItem) =>
        relationEdgeKey(edge) === relationEdgeKey(base),
    )
    if (exact) {
      consumed.add(relationEdgeKey(exact))
      list.push({ state: 'unchanged', edge: exact, order: index })
      return
    }
    const reassigned = model.value.find(
      (edge: AnimeRelationEdgeItem) =>
        edge.animeId === base.animeId &&
        !baselineKeys.value.has(relationEdgeKey(edge)) &&
        !consumed.has(relationEdgeKey(edge)),
    )
    if (reassigned) {
      consumed.add(relationEdgeKey(reassigned))
      list.push({ state: 'changed', edge: reassigned, order: index })
      return
    }
    list.push({ state: 'removed', edge: base, order: index })
  })
  model.value.forEach((edge: AnimeRelationEdgeItem, index: number) => {
    if (consumed.has(relationEdgeKey(edge))) return
    list.push({ state: 'added', edge, order: baseline.length + index })
  })
  return list.sort((a, b) => a.order - b.order)
})

function restore(edge: AnimeRelationEdgeItem) {
  if (
    model.value.some(
      (item: AnimeRelationEdgeItem) =>
        relationEdgeKey(item) === relationEdgeKey(edge),
    )
  ) {
    return
  }
  model.value = [...model.value, { ...edge }]
}

const query = ref('')
const debouncedQuery = refDebounced(query, 300)
const results = ref<AnimeRelationSearchResult[]>([])
const searching = ref(false)
const selected = ref<AnimeRelationSearchResult | null>(null)
const kind = ref<AnimeRelationViewKind>('SEQUEL')

watch(debouncedQuery, async (value) => {
  const term = value.trim()
  if (term.length < 2) {
    results.value = []
    return
  }
  searching.value = true
  let found: AnimeRelationSearchResult[] = []
  try {
    found = await props.searchAnime(term)
  } catch {
    found = []
  } finally {
    searching.value = false
  }
  if (debouncedQuery.value.trim() !== term) return
  results.value = found
})

const linkedKeys = computed(
  () =>
    new Set(
      model.value.map((edge: AnimeRelationEdgeItem) => relationEdgeKey(edge)),
    ),
)

const exhaustedIds = computed(
  () =>
    new Set([
      ...(props.selfId ? [props.selfId] : []),
      ...model.value
        .map((edge: AnimeRelationEdgeItem) => edge.animeId)
        .filter((animeId: string) =>
          animeRelationViewOptions.every((option) =>
            linkedKeys.value.has(`${animeId}:${option.value}`),
          ),
        ),
    ]),
)

const toItem = (item: AnimeRelationSearchResult) => ({
  label: item.titleEnglish ?? '',
  suffix: item.startDate?.year ? String(item.startDate.year) : undefined,
  value: item.id,
})

const resultItems = computed(() => {
  const items = results.value
    .filter(
      (item: AnimeRelationSearchResult) => !exhaustedIds.value.has(item.id),
    )
    .map(toItem)
  const current = selected.value
  if (current && !items.some((item) => item.value === current.id)) {
    items.unshift(toItem(current))
  }
  return items
})

const selectedId = computed({
  get: () => selected.value?.id,
  set: (id: string | undefined) => {
    selected.value =
      results.value.find((item: AnimeRelationSearchResult) => item.id === id) ??
      (selected.value?.id === id ? selected.value : null)
  },
})

const duplicate = computed(() =>
  selected.value
    ? linkedKeys.value.has(`${selected.value.id}:${kind.value}`)
    : false,
)

const addKindOptions = computed(() => {
  const current = selected.value
  return animeRelationViewOptions.map((option) => ({
    ...option,
    disabled: current
      ? linkedKeys.value.has(`${current.id}:${option.value}`)
      : false,
  }))
})

function add() {
  if (!selected.value || duplicate.value) return
  model.value = [
    ...model.value,
    {
      animeId: selected.value.id,
      title: selected.value.titleEnglish ?? '',
      kind: kind.value,
    },
  ]
  selected.value = null
  query.value = ''
  results.value = []
}

function remove(edge: AnimeRelationEdgeItem) {
  model.value = model.value.filter(
    (item: AnimeRelationEdgeItem) =>
      relationEdgeKey(item) !== relationEdgeKey(edge),
  )
}

function kindOptions(edge: AnimeRelationEdgeItem) {
  return animeRelationViewOptions.map((option) => ({
    ...option,
    disabled:
      option.value !== edge.kind &&
      model.value.some(
        (item: AnimeRelationEdgeItem) =>
          item.animeId === edge.animeId && item.kind === option.value,
      ),
  }))
}

function setKind(edge: AnimeRelationEdgeItem, next: AnimeRelationViewKind) {
  const exists = model.value.some(
    (item: AnimeRelationEdgeItem) =>
      item.animeId === edge.animeId && item.kind === next,
  )
  if (exists) return
  model.value = model.value.map((item: AnimeRelationEdgeItem) =>
    relationEdgeKey(item) === relationEdgeKey(edge)
      ? { ...item, kind: next }
      : item,
  )
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <ul v-if="rows.length" class="flex flex-col gap-2">
      <li
        v-for="{ state, edge } in rows"
        :key="`${state}:${relationEdgeKey(edge)}`"
        :data-state="state"
        class="border-default flex min-h-12 items-center gap-3 rounded-md border p-2"
        :class="{
          'ring-info ring-1': state === 'added' || state === 'changed',
          'ring-error border-dashed ring-1': state === 'removed',
        }"
      >
        <template v-if="state !== 'removed'">
          <USelect
            :model-value="edge.kind"
            :items="kindOptions(edge)"
            value-key="value"
            size="sm"
            class="w-44 shrink-0"
            aria-label="Relation kind"
            @update:model-value="
              (next: AnimeRelationViewKind) => setKind(edge, next)
            "
          />
          <span
            data-testid="relation-title"
            class="text-highlighted min-w-0 flex-1 truncate text-sm"
          >
            {{ edge.title }}
          </span>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Remove relation"
            @click="remove(edge)"
          />
        </template>
        <template v-else>
          <USelect
            :model-value="edge.kind"
            :items="animeRelationViewOptions"
            value-key="value"
            size="sm"
            class="w-44 shrink-0"
            aria-label="Relation kind"
            disabled
          />
          <span
            data-testid="relation-title"
            class="text-muted min-w-0 flex-1 truncate text-sm line-through"
          >
            {{ edge.title }}
          </span>
          <UButton
            icon="i-lucide-undo-2"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Restore relation"
            @click="restore(edge)"
          />
        </template>
      </li>
    </ul>
    <p v-else class="text-muted text-sm">No relations yet.</p>

    <div class="border-default flex flex-col gap-2 border-t pt-3 sm:flex-row">
      <USelect
        v-model="kind"
        :items="addKindOptions"
        value-key="value"
        class="w-full sm:w-44"
        aria-label="Relation kind"
      />
      <USelectMenu
        v-model="selectedId"
        v-model:search-term="query"
        :items="resultItems"
        value-key="value"
        :loading="searching"
        ignore-filter
        placeholder="Search anime…"
        aria-label="Search anime"
        class="w-full flex-1"
      >
        <template #item-trailing="{ item }">
          <span v-if="item.suffix" class="text-muted text-xs">
            {{ item.suffix }}
          </span>
        </template>
      </USelectMenu>
      <UButton
        label="Add"
        icon="i-lucide-plus"
        color="neutral"
        variant="outline"
        :disabled="!selected || duplicate"
        @click="add()"
      />
    </div>
  </div>
</template>
