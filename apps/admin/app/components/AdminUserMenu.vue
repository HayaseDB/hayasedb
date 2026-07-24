<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

withDefaults(defineProps<{ collapsed?: boolean }>(), { collapsed: false })

const config = useRuntimeConfig()
const { data: session } = await useAppSession()
const user = computed(() => session.value?.user ?? null)
const { signOut } = useAccountActions()

const items = computed<DropdownMenuItem[][]>(() => [
  [{ label: user.value?.name ?? '', type: 'label', slot: 'account' }],
  [
    {
      label: 'Back to website',
      icon: 'i-lucide-globe',
      to: config.public.webUrl,
    },
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: () => void signOut(),
    },
  ],
])
</script>

<template>
  <UDropdownMenu
    v-if="user"
    :items="items"
    :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-56' }"
    :content="{ side: 'top', align: 'start', sideOffset: 8 }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      block
      class="data-[state=open]:bg-elevated"
      :class="collapsed ? 'px-0' : 'px-2'"
      :square="collapsed"
    >
      <UAvatar
        :src="user.image ?? undefined"
        :alt="user.name"
        size="sm"
        class="shrink-0"
      />
      <span v-if="!collapsed" class="min-w-0 flex-1 text-left">
        <span class="text-highlighted block truncate text-sm font-medium">
          {{ user.name }}
        </span>
        <span class="text-muted block truncate text-xs font-normal">
          {{ user.email }}
        </span>
      </span>
      <UIcon
        v-if="!collapsed"
        name="i-lucide-chevrons-up-down"
        class="text-dimmed size-4 shrink-0"
      />
    </UButton>

    <template #account-label>
      <p class="text-highlighted truncate font-medium">{{ user.name }}</p>
      <p class="text-muted truncate text-xs font-normal">{{ user.email }}</p>
    </template>
  </UDropdownMenu>
</template>
