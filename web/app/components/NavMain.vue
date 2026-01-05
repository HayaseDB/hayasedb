<script setup lang="ts">
  import type { Component } from 'vue'

  import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from '@/components/ui/sidebar'

  defineProps<{
    items: {
      title: string
      url: string
      icon?: Component
      isActive?: boolean
      disabled?: boolean
    }[]
  }>()

  const route = useRoute()

  const isActive = (url: string) => {
    return route.path === url || route.path.startsWith(url + '/')
  }
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in items" :key="item.title">
        <SidebarMenuButton
          :tooltip="item.title"
          :is-active="!item.disabled && isActive(item.url)"
          :disabled="item.disabled"
          as-child
        >
          <NuxtLink :to="item.disabled ? '#' : item.url">
            <component :is="item.icon" v-if="item.icon" />
            <span>{{ item.title }}</span>
          </NuxtLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
