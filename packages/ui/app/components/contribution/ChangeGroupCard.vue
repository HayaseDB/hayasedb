<script setup lang="ts">
import type { ChangeDetail } from '@hayasedb/contract'

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

const childOffset = computed(
  () => 'calc(var(--change-sticky-top, 0px) + 3.5rem)',
)

const animeRows = computed(() =>
  props.group.anime ? buildDiffRows(props.group.anime) : [],
)
</script>

<template>
  <UCard
    :id="group.anime ? `change-${group.anime.id}` : undefined"
    variant="subtle"
    :ui="{
      root: 'overflow-visible ring-0 border-0 relative [clip-path:inset(0_round_var(--radius-lg,0.5rem))] after:pointer-events-none after:absolute after:inset-0 after:z-30 after:rounded-lg after:border after:border-default after:content-[\'\']',
      header:
        'h-14 flex items-center sticky top-[var(--change-sticky-top,0px)] z-20 bg-elevated',
    }"
    :class="conflicted && 'after:border-error/30'"
  >
    <template #header>
      <div class="flex w-full min-w-0 items-center gap-2">
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
