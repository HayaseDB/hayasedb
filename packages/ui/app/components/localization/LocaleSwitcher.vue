<script setup lang="ts">
import type { CommandPaletteItem } from '@nuxt/ui'
import type { LocalizationLocale } from '@hayasedb/domain'

interface SwitcherItem {
  value: LocalizationLocale
  label: string
  invalid?: boolean
  changed?: boolean
}

const props = withDefaults(
  defineProps<{
    items: SwitcherItem[]
    addOptions: { value: LocalizationLocale; label: string }[]
    canAdd: boolean
    canRemove: boolean
    showOriginal?: boolean
    isOriginal?: boolean
    changed?: boolean
  }>(),
  { showOriginal: false, isOriginal: false, changed: false },
)

const locale = defineModel<LocalizationLocale | undefined>('locale')

const emit = defineEmits<{
  remove: []
  makeOriginal: []
  add: [locale: LocalizationLocale]
}>()

const addOpen = ref(false)

function handleAdd(item: CommandPaletteItem) {
  const locale = (item as { value?: LocalizationLocale }).value
  if (!locale) return
  addOpen.value = false
  emit('add', locale)
}

const invalidCount = computed(
  () => props.items.filter((item) => item.invalid).length,
)
</script>

<template>
  <div
    class="border-default flex flex-wrap items-center justify-between gap-2 border-y py-3"
    :class="changed && 'border-info'"
  >
    <div class="flex min-w-0 items-center gap-2">
      <UIcon
        name="i-lucide-languages"
        class="text-muted size-4 shrink-0"
        aria-hidden="true"
      />
      <USelectMenu
        v-model="locale"
        :items="items"
        value-key="value"
        :search-input="{ placeholder: 'Search languages…' }"
        aria-label="Editing language"
        class="w-56 max-w-full"
      >
        <template #item-trailing="{ item }">
          <UIcon
            v-if="item.invalid"
            name="i-lucide-circle-alert"
            class="text-error size-4"
            aria-label="Has errors"
          />
          <UIcon
            v-else-if="item.changed"
            name="i-lucide-dot"
            class="text-info size-4"
            aria-label="Has unsaved changes"
          />
        </template>
      </USelectMenu>

      <UBadge
        v-if="showOriginal && isOriginal"
        label="Original"
        color="neutral"
        variant="subtle"
        size="sm"
      />

      <UBadge
        v-if="invalidCount > 0"
        :label="String(invalidCount)"
        icon="i-lucide-circle-alert"
        color="error"
        variant="subtle"
        size="sm"
        :title="`${invalidCount} language${invalidCount === 1 ? '' : 's'} with errors`"
      />
    </div>

    <div class="flex items-center gap-1">
      <UButton
        v-if="showOriginal && !isOriginal"
        type="button"
        icon="i-lucide-star"
        label="Set original"
        color="neutral"
        variant="ghost"
        size="sm"
        title="Mark as original language"
        @click="emit('makeOriginal')"
      />

      <UPopover v-model:open="addOpen" :content="{ align: 'end' }">
        <UButton
          type="button"
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="sm"
          square
          :disabled="!canAdd"
          aria-label="Add language"
          :title="canAdd ? 'Add language' : 'All languages added'"
        />

        <template #content>
          <UCommandPalette
            :groups="[{ id: 'locales', items: addOptions }]"
            :fuse="{ resultLimit: 100 }"
            placeholder="Search languages…"
            class="h-72 w-64"
            :ui="{ input: '[&>input]:h-9' }"
            @update:model-value="handleAdd"
          />
        </template>
      </UPopover>

      <UButton
        type="button"
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="sm"
        square
        :disabled="!canRemove"
        aria-label="Remove current language"
        :title="
          canRemove
            ? 'Remove this language'
            : 'At least one language is required'
        "
        @click="emit('remove')"
      />
    </div>
  </div>
</template>
