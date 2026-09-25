<script setup lang="ts">
const props = defineProps<{
  child: ChangeGroupChild
  offset?: string
  depth?: number
}>()

defineSlots<{ actions?: () => unknown }>()

const hidden = computed(() =>
  props.child.change ? hiddenDiffFields(props.child.change) : new Set<string>(),
)

const rows = computed(() =>
  props.child.change ? buildDiffRows(props.child.change, hidden.value) : [],
)

const contextKind = computed(
  () => props.child.change?.entityKind ?? 'animeSeason',
)

const icon = computed(() => ENTITY_KIND_ICONS[contextKind.value])

const depth = computed(() => props.depth ?? 1)

const top = computed(() => props.offset ?? '0px')

const stickyZ = computed(() => String(Math.max(20 - depth.value, 1)))

const childOffset = computed(() => `calc(${top.value} + 2.75rem)`)
</script>

<template>
  <UCard
    :id="child.change ? `change-${child.change.id}` : undefined"
    variant="subtle"
    :ui="{
      root: 'overflow-visible ring-0 border-0 relative [clip-path:inset(0_round_var(--radius-lg,0.5rem))] after:pointer-events-none after:absolute after:inset-0 after:z-30 after:rounded-lg after:border after:border-default after:content-[\'\']',
      header:
        'h-11 flex items-center p-3 sm:px-4 sticky top-(--change-sticky-own) z-(--change-sticky-z) bg-elevated',
      body: 'p-3 sm:p-4',
    }"
    :style="{
      '--change-sticky-own': top,
      '--change-sticky-z': stickyZ,
    }"
    :class="child.change?.conflicted && 'after:border-error/30'"
  >
    <template #header>
      <div class="flex w-full min-w-0 items-center gap-2">
        <UIcon :name="icon" class="text-dimmed size-4 shrink-0" />
        <UBadge
          v-if="child.change"
          :label="CHANGE_OP_LABELS[child.change.op]"
          :color="CHANGE_OP_COLORS[child.change.op]"
          variant="subtle"
          size="sm"
        />
        <span class="text-highlighted min-w-0 truncate text-sm font-medium">
          {{ child.title }}
        </span>
        <UBadge
          v-if="child.change?.conflicted"
          label="Conflict"
          color="error"
          variant="subtle"
          size="sm"
        />
        <span class="flex-1" />
        <slot v-if="child.change" name="actions" />
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <ChangeDiffTable
        v-if="child.change && rows.length"
        :change="child.change"
        :hidden="hidden"
      />
      <ChangeContextTable
        v-if="child.context"
        :entity-kind="contextKind"
        :document="child.context"
      />
      <p
        v-if="!child.context && !(child.change && rows.length)"
        class="text-muted text-sm"
      >
        Only its place in the order changed.
      </p>

      <ChangeChildSection
        v-for="episode in child.episodes"
        :key="episode.change?.id ?? episode.title"
        :child="episode"
        :offset="childOffset"
        :depth="depth + 1"
      >
        <template #actions>
          <slot name="actions" />
        </template>
      </ChangeChildSection>
    </div>
  </UCard>
</template>
