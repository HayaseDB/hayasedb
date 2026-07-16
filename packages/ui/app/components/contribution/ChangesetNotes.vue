<script setup lang="ts">
import { changesetNoteBodySchema, type ChangesetNote } from '@hayasedb/contract'

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
      <div v-for="note in notes" :key="note.id" class="flex items-start gap-3">
        <UAvatar
          :src="note.author.image ?? undefined"
          :alt="note.author.name ?? 'User'"
          size="sm"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-highlighted text-sm font-medium">
              {{ note.author.name ?? unknownAuthorLabel }}
            </span>
            <span class="text-muted text-xs">
              {{ formatDateTime(note.createdAt) }}
            </span>
          </div>
          <p class="text-toned text-sm whitespace-pre-line">{{ note.body }}</p>
        </div>
      </div>

      <p v-if="notes.length === 0" class="text-muted text-sm">No notes yet.</p>

      <div class="border-default flex flex-col gap-2 border-t pt-4">
        <UTextarea
          v-model="body"
          :rows="2"
          :placeholder="placeholder"
          :maxlength="maxLength"
        />
        <div class="flex justify-end">
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
  </UPageCard>
</template>
