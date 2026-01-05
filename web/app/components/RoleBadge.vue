<script setup lang="ts">
  import { computed } from 'vue'
  import { Badge } from '@/components/ui/badge'

  type Role = 'administrator' | 'moderator' | 'user'
  type Size = 'sm' | 'default'

  const props = withDefaults(
    defineProps<{
      role: string
      size?: Size
    }>(),
    {
      size: 'sm',
    },
  )

  const sizeClasses: Record<Size, string> = {
    sm: 'text-[10px] px-1.5 py-0',
    default: '',
  }

  const roleConfig: Record<Role, { label: string; class: string }> = {
    administrator: { label: 'Admin', class: 'bg-red-500/10 text-red-600 border-red-500/50' },
    moderator: { label: 'Mod', class: 'bg-blue-500/10 text-blue-600 border-blue-500/50' },
    user: { label: 'User', class: 'bg-gray-500/10 text-gray-600 border-gray-500/50' },
  }

  const normalizedRole = computed(() => (props.role as Role) || 'user')
  const config = computed(() => roleConfig[normalizedRole.value] ?? roleConfig.user)
  const classes = computed(() => [config.value.class, sizeClasses[props.size]])
</script>

<template>
  <Badge variant="outline" :class="classes">
    {{ config.label }}
  </Badge>
</template>
