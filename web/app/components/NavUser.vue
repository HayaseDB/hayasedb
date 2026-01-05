<script setup lang="ts">
  import { ChevronsUpDown, LogOut, Settings } from 'lucide-vue-next'
  import { computed } from 'vue'

  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
  import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
  } from '@/components/ui/sidebar'

  const { data: session, signOut } = useAuth()
  const { isMobile } = useSidebar()

  const user = computed(() => session.value)

  const userInitials = computed(() => {
    return user.value?.username?.[0]?.toUpperCase() ?? 'U'
  })

  const displayName = computed(() => {
    if (!user.value) return 'User'
    return user.value.username
  })

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar :key="user?.profilePicture?.url ?? 'fallback'" class="h-8 w-8">
              <AvatarImage
                v-if="user?.profilePicture?.url"
                :src="user.profilePicture.url"
                :alt="displayName"
              />
              <AvatarFallback>
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 overflow-hidden text-left text-sm leading-tight">
              <div class="flex items-center gap-1.5">
                <span class="truncate font-medium">{{ displayName }}</span>
                <RoleBadge v-if="user?.role" :role="user.role" />
              </div>
              <span class="text-muted-foreground truncate text-xs">{{ user?.email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="24"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar :key="user?.profilePicture?.url ?? 'fallback'" class="h-8 w-8">
                <AvatarImage
                  v-if="user?.profilePicture?.url"
                  :src="user.profilePicture.url"
                  :alt="displayName"
                />
                <AvatarFallback>
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <div class="flex items-center gap-1.5">
                  <span class="truncate font-semibold">{{ displayName }}</span>
                  <RoleBadge v-if="user?.role" :role="user.role" />
                </div>
                <span class="text-muted-foreground truncate text-xs">{{ user?.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <NuxtLink to="/dashboard/settings" class="flex w-full items-center gap-2">
                <Settings class="size-4" />
                Settings
              </NuxtLink>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            <LogOut class="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
