<script setup lang="ts">
import { changesetNoteBodySchema, type ChangesetNote } from '@hayasedb/contract'
import type { TimelineItem } from '@nuxt/ui'

type DisplayNote = Omit<ChangesetNote, 'createdAt'> & {
  createdAt: Date | string
}

const props = withDefaults(
  defineProps<{
    notes: DisplayNote[]
    placeholder: string
    unknownAuthorLabel?: string
    title?: string
    onAdd: (body: string) => unknown | Promise<unknown>
  }>(),
  { title: 'Notes', unknownAuthorLabel: '(deleted user)' },
)

const maxLength = changesetNoteBodySchema.maxLength ?? undefined

const body = ref('')
const pending = ref(false)

const items = computed<TimelineItem[]>(() =>
  props.notes.map((note: DisplayNote) => ({
    value: note.id,
    username: note.author.name ?? props.unknownAuthorLabel,
    action: 'commented',
    date: formatRelativeTime(note.createdAt),
    description: note.body,
    avatar: {
      src: note.author.image ?? undefined,
      alt: note.author.name ?? 'User',
      loading: 'lazy' as const,
    },
  })),
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
        </template>
      </UTimeline>

      <UEmpty
        v-else
        icon="i-lucide-messages-square"
        title="No notes yet"
        description="Start the conversation below."
      />

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
              label="Add note"
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
