<script setup lang="ts">
import type { AccountUser } from '@hayasedb/contract'

const props = withDefaults(
  defineProps<{
    user?: AccountUser | null
    resending?: boolean
    cooldown?: number
  }>(),
  {
    user: null,
    resending: false,
    cooldown: 0,
  },
)

defineEmits<{
  resend: []
}>()

const createdAt = computed(() => {
  if (!props.user?.createdAt) return null
  const date = new Date(props.user.createdAt)
  return Number.isNaN(date.getTime()) ? null : date
})

const resendLabel = computed(() =>
  props.cooldown > 0 ? `Resend in ${props.cooldown}s` : 'Resend email',
)
</script>

<template>
  <UPageCard v-if="user" variant="subtle">
    <div class="flex items-center gap-4">
      <UAvatar
        :src="user.image ?? undefined"
        :alt="user.name"
        size="3xl"
        class="size-16 shrink-0 text-xl"
      />

      <div class="min-w-0 flex-1">
        <p class="text-highlighted truncate font-medium">{{ user.name }}</p>
        <p class="text-muted truncate text-sm">{{ user.email }}</p>
        <p v-if="createdAt" class="text-dimmed mt-1 text-xs">
          Member since
          <NuxtTime
            :datetime="createdAt"
            year="numeric"
            month="long"
            day="numeric"
          />
        </p>
      </div>
    </div>

    <UAlert
      v-if="!user.emailVerified"
      color="warning"
      variant="subtle"
      icon="i-lucide-mail-warning"
      title="Verify your email"
      description="Confirm your email address to unlock avatar uploads and email changes."
      class="mt-4"
      :actions="[
        {
          label: resendLabel,
          color: 'warning',
          variant: 'solid',
          loading: resending,
          disabled: cooldown > 0,
          onClick: () => $emit('resend'),
        },
      ]"
    />
  </UPageCard>
</template>
