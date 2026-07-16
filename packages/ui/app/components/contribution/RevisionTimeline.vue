<script setup lang="ts">
import type { RevisionListItem } from '@hayasedb/contract'
import type { EntityKind } from '@hayasedb/domain'

type TimelineRevision = Omit<RevisionListItem, 'createdAt'> & {
  createdAt: Date | string
}

const props = withDefaults(
  defineProps<{
    revisions: TimelineRevision[]
    entityKind: EntityKind
    headRev?: number
    busy?: boolean
    onRevert?: (id: string) => unknown | Promise<unknown>
    changesetLink?: (changesetId: string) => string
  }>(),
  {
    headRev: undefined,
    busy: false,
    onRevert: undefined,
    changesetLink: undefined,
  },
)

const latestRev = computed(
  () =>
    props.headRev ??
    Math.max(0, ...props.revisions.map((r: TimelineRevision) => r.rev)),
)
</script>

<template>
  <div class="divide-default border-default divide-y rounded-lg border">
    <div
      v-for="revision in revisions"
      :key="revision.id"
      class="flex flex-col gap-2 px-4 py-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          :label="`r${revision.rev}`"
          color="neutral"
          variant="outline"
          size="sm"
        />
        <UBadge
          :label="CHANGE_OP_LABELS[revision.op]"
          :color="CHANGE_OP_COLORS[revision.op]"
          variant="subtle"
          size="sm"
        />
        <span class="text-highlighted text-sm font-medium">
          {{ revision.editor?.name ?? 'System' }}
        </span>
        <span class="text-muted text-xs">{{
          formatDateTime(revision.createdAt)
        }}</span>
        <span class="flex-1" />
        <UButton
          v-if="onRevert && revision.rev !== latestRev"
          label="Revert to this"
          icon="i-lucide-undo-2"
          color="neutral"
          variant="ghost"
          size="xs"
          :loading="busy"
          @click="() => void onRevert?.(revision.id)"
        />
      </div>
      <p v-if="revision.changesetSummary" class="text-muted text-sm">
        {{ revision.changesetSummary }}
        <ULink
          v-if="revision.changesetId && changesetLink"
          :to="changesetLink(revision.changesetId)"
          class="text-primary text-xs"
        >
          view changeset
        </ULink>
      </p>
      <div v-if="revision.changedFields.length" class="flex flex-wrap gap-1">
        <UBadge
          v-for="field in revision.changedFields"
          :key="field"
          :label="contributionFieldLabel(entityKind, field)"
          color="neutral"
          variant="soft"
          size="sm"
        />
      </div>
    </div>
    <p v-if="revisions.length === 0" class="text-muted px-4 py-6 text-sm">
      No revisions yet.
    </p>
  </div>
</template>
