<script setup lang="ts">
  import { User, Lock, ImageIcon, AlertTriangle, Monitor } from 'lucide-vue-next'
  import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

  definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth',
    breadcrumb: {
      label: 'Settings',
    },
  })

  useSeoMeta({
    title: 'Account Settings',
    description: 'Manage your HayaseDB account settings',
  })

  const route = useRoute()

  const tabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'security', label: 'Security', icon: Lock },
    { value: 'picture', label: 'Picture', icon: ImageIcon },
    { value: 'sessions', label: 'Sessions', icon: Monitor },
    { value: 'danger', label: 'Danger', icon: AlertTriangle },
  ]

  const currentTab = computed(() => {
    const tab = tabs.find((t) => route.path.endsWith(`/${t.value}`))
    return tab?.value ?? 'profile'
  })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
      <p class="text-muted-foreground">Manage your account settings and preferences.</p>
    </div>

    <Tabs :model-value="currentTab" class="w-full">
      <TabsList class="grid w-full grid-cols-5 lg:w-fit">
        <NuxtLink v-for="tab in tabs" :key="tab.value" :to="`/dashboard/settings/${tab.value}`">
          <TabsTrigger :value="tab.value" class="w-full gap-2">
            <component :is="tab.icon" class="h-4 w-4" />
            <span class="hidden sm:inline">{{ tab.label }}</span>
          </TabsTrigger>
        </NuxtLink>
      </TabsList>
    </Tabs>

    <NuxtPage />
  </div>
</template>
