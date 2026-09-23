<script setup lang="ts">
import type { ChangeDetail } from '@hayasedb/contract'
import { useResizeObserver } from '@vueuse/core'

const props = defineProps<{ group: ChangeGroup }>()

defineSlots<{
  actions?: (props: { change: ChangeDetail }) => unknown
}>()

const conflicted = computed(
  () =>
    props.group.anime?.conflicted ||
    props.group.children.some((child) => child.change?.conflicted),
)

const icon = computed(() =>
  props.group.anime
    ? ENTITY_KIND_ICONS[props.group.anime.entityKind]
    : ENTITY_KIND_ICONS.anime,
)

const card = useTemplateRef<{ $el: HTMLElement }>('card')
const root = computed(() => card.value?.$el ?? null)
const stickyTop = useStickyOffset(root)

const headerHeight = ref(0)

const headerEl = computed(
  () =>
    (card.value?.$el?.querySelector('[data-slot="header"]') as HTMLElement) ??
    null,
)

useResizeObserver(headerEl, () => {
  headerHeight.value = headerEl.value?.offsetHeight ?? 0
})

const childOffset = computed(
  () => `calc(${stickyTop.value} + ${Math.round(headerHeight.value)}px)`,
)

const animeRows = computed(() =>
  props.group.anime ? buildDiffRows(props.group.anime) : [],
)
</script>

<template>
  <UCard
    :id="group.anime ? `change-${group.anime.id}` : undefined"
    ref="card"
    variant="subtle"
    :ui="{
      root: 'overflow-visible',
      header: 'sticky top-(--change-sticky-top) z-20 bg-elevated rounded-t-lg',
    }"
    :class="conflicted && 'ring-error/30 ring-1'"
    :style="{ '--change-sticky-top': stickyTop }"
  >
    <template #header>
      <div class="flex w-full flex-wrap items-center gap-2">
        <UIcon :name="icon" class="text-dimmed size-4 shrink-0" />
        <UBadge
          v-if="group.anime"
          :label="CHANGE_OP_LABELS[group.anime.op]"
          :color="CHANGE_OP_COLORS[group.anime.op]"
          variant="subtle"
        />
        <span class="text-highlighted min-w-0 truncate font-medium">
          {{ group.title }}
        </span>
        <UBadge
          v-if="conflicted"
          label="Conflict"
          color="error"
          variant="subtle"
        />
        <span class="flex-1" />
        <slot v-if="group.anime" name="actions" :change="group.anime" />
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <ChangeDiffTable
        v-if="group.anime && animeRows.length"
        :change="group.anime"
      />

      <ChangeContextTable
        v-if="group.context"
        entity-kind="anime"
        :document="group.context"
      />

      <ChangeChildSection
        v-for="child in group.children"
        :key="child.change?.id ?? child.title"
        :child="child"
        :offset="childOffset"
      >
        <template #actions>
          <slot v-if="child.change" name="actions" :change="child.change" />
        </template>
      </ChangeChildSection>
    </div>
  </UCard>
</template>
