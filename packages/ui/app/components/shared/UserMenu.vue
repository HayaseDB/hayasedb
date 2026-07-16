<script setup lang="ts">
import type { AccountUser } from '@hayasedb/contract'
import type { DropdownMenuItem } from '@nuxt/ui'

const props = withDefaults(
  defineProps<{
    user?: AccountUser | null
    signInTo?: string
    showContributions?: boolean
    onSignOut?: () => unknown
  }>(),
  {
    user: null,
    signInTo: '/login',
    showContributions: false,
    onSignOut: undefined,
  },
)

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: props.user?.name ?? '',
      type: 'label',
      slot: 'account',
    },
  ],
  [
    ...(props.showContributions
      ? [
          {
            label: 'My contributions',
            icon: 'i-lucide-git-pull-request-arrow',
            to: '/contributions',
          },
        ]
      : []),
    { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: () => void props.onSignOut?.(),
    },
  ],
])
</script>

<template>
  <UDropdownMenu
    v-if="user"
    :items="items"
    :ui="{ content: 'w-56' }"
    :content="{ align: 'end' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      class="rounded-full p-0"
      :aria-label="user.name"
    >
      <UAvatar :src="user.image ?? undefined" :alt="user.name" size="md" />
    </UButton>

    <template #account-label>
      <p class="text-highlighted truncate font-medium">{{ user.name }}</p>
      <p class="text-muted truncate text-xs font-normal">{{ user.email }}</p>
    </template>
  </UDropdownMenu>

  <UButton v-else :to="signInTo" color="primary" variant="solid" size="sm">
    Login
  </UButton>
</template>
