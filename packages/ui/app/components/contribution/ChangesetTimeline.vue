<script setup lang="ts">
import { changesetMessageBodySchema } from '@hayasedb/contract'
import type { TimelineItem } from '@nuxt/ui'

const props = withDefaults(
  defineProps<{
    changeset: TimelineChangeset
    placeholder: string
    changesetPath: (id: string) => string
    unknownAuthorLabel?: string
    title?: string
    onAdd: (body: string) => unknown | Promise<unknown>
  }>(),
  {
    title: 'Activity',
    unknownAuthorLabel: '(deleted user)',
  },
)

const maxLength = changesetMessageBodySchema.maxLength ?? undefined

const body = ref('')
const pending = ref(false)

function avatarOf(actor: TimelineActor) {
  return {
    src: actor.image ?? undefined,
    alt: actor.name ?? 'User',
    loading: 'lazy' as const,
  }
}

function submittedAction(
  entry: ChangesetTimelineEntry & { type: 'submitted' },
) {
  if (entry.variant === 'revert') return 'submitted a revert'
  if (entry.variant === 'revision') return 'submitted a revision'
  const count = entry.changeCount
  return `proposed ${count} ${count === 1 ? 'change' : 'changes'}`
}

const items = computed<TimelineItem[]>(() =>
  buildChangesetTimeline(props.changeset).map((entry) => {
    const base = {
      value: entry.id,
      username: entry.actor.name ?? props.unknownAuthorLabel,
      date: formatRelativeTime(entry.date),
    }
    switch (entry.type) {
      case 'submitted':
        return {
          ...base,
          avatar: avatarOf(entry.actor),
          action: submittedAction(entry),
          link: entry.targetId
            ? {
                label:
                  entry.variant === 'revert'
                    ? 'View the reverted contribution'
                    : 'View the earlier submission',
                to: props.changesetPath(entry.targetId),
              }
            : undefined,
        }
      case 'comment':
        return {
          ...base,
          avatar: avatarOf(entry.actor),
          action: 'commented',
          description: entry.body,
        }
      case 'system':
        return {
          ...base,
          icon: 'i-lucide-triangle-alert',
          ui: { indicator: 'bg-warning/10 text-warning' },
          action: 'could not apply this contribution',
          description: entry.body,
        }
      case 'rejected':
        return {
          ...base,
          icon: 'i-lucide-x',
          ui: { indicator: 'bg-error/10 text-error' },
          action: 'rejected this contribution',
          description: entry.body ?? undefined,
        }
      case 'approved':
        return {
          ...base,
          icon: 'i-lucide-check',
          ui: { indicator: 'bg-success/10 text-success' },
          action: 'approved this contribution',
        }
      case 'withdrawn':
        return {
          ...base,
          icon: 'i-lucide-undo-2',
          action: 'withdrew this contribution',
        }
      case 'superseded':
        return {
          ...base,
          icon: 'i-lucide-git-branch',
          action: 'revised this contribution',
          link: {
            label: 'View the revision',
            to: props.changesetPath(entry.targetId),
          },
        }
      case 'reverted':
        return {
          ...base,
          icon: 'i-lucide-history',
          ui: { indicator: 'bg-error/10 text-error' },
          action: 'reverted this contribution',
          link: {
            label: 'View the revert',
            to: props.changesetPath(entry.targetId),
          },
        }
    }
  }),
)

const remaining = computed(() =>
  maxLength ? maxLength - body.value.length : null,
)

function onEnter(event: KeyboardEvent) {
  if (!event.metaKey && !event.ctrlKey) return
  event.preventDefault()
  submit()
}

async function submit() {
  const trimmed = body.value.trim()
  if (!trimmed || pending.value) return
  pending.value = true
  try {
    const added = await props.onAdd(trimmed)
    if (added !== false) body.value = ''
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UPageCard :title="title" variant="subtle">
    <div class="flex flex-col gap-4">
      <UTimeline
        v-if="items.length"
        :items="items"
        size="xs"
        color="neutral"
        :ui="{
          date: 'float-end ms-1',
          description:
            'px-3 py-2 ring ring-default mt-2 rounded-md text-default whitespace-pre-line',
        }"
      >
        <template #title="{ item }">
          <span>{{ item.username }}</span>
          <span class="text-muted font-normal">&nbsp;{{ item.action }}</span>
          <template v-if="item.link">
            <span class="text-muted font-normal">&nbsp;·&nbsp;</span>
            <ULink :to="item.link.to" class="font-normal">
              {{ item.link.label }}
            </ULink>
          </template>
        </template>
      </UTimeline>

      <div class="border-default flex flex-col gap-2 border-t pt-4">
        <UTextarea
          v-model="body"
          :rows="2"
          :placeholder="placeholder"
          :maxlength="maxLength"
          :disabled="pending"
          @keydown.enter="onEnter"
        />
        <div class="flex items-center gap-2">
          <span
            v-if="remaining !== null && body.length > 0"
            class="text-muted text-xs"
          >
            {{ remaining }} characters left
          </span>

          <div class="ms-auto flex items-center gap-2">
            <span class="hidden items-center gap-1 sm:flex">
              <UKbd value="meta" size="md" />
              <UKbd value="enter" size="md" />
            </span>
            <UButton
              label="Comment"
              size="sm"
              variant="soft"
              :loading="pending"
              :disabled="!body.trim()"
              @click="submit()"
            />
          </div>
        </div>
      </div>
    </div>
  </UPageCard>
</template>
