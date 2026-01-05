<script setup lang="ts">
  import type { SidebarProps } from '@/components/ui/sidebar'
  import { Home } from 'lucide-vue-next'

  import NavMain from '@/components/NavMain.vue'
  import NavUser from '@/components/NavUser.vue'
  import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'

  const props = withDefaults(defineProps<SidebarProps>(), {
    variant: 'inset',
    collapsible: 'icon',
  })

  const navMain = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
      isActive: true,
    },
  ]
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <NuxtLink
        to="/"
        class="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center"
      >
        <img src="~/assets/svg/icon-rounded.svg" alt="HayaseDB" class="size-8 shrink-0" />
        <span
          class="truncate text-xl font-bold tracking-tight group-data-[collapsible=icon]:hidden"
        >
          HayaseDB
        </span>
      </NuxtLink>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="navMain" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
  </Sidebar>
</template>
