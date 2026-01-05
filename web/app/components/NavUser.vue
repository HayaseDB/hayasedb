<script setup lang="ts">
  import { ChevronsUpDown, LogOut, Settings, User } from 'lucide-vue-next'
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
    if (!user.value) return 'U'
    if (user.value.firstName && user.value.lastName) {
      return `${user.value.firstName[0]}${user.value.lastName[0]}`.toUpperCase()
    }
    if (user.value.username) {
      return user.value.username.substring(0, 2).toUpperCase()
    }
    if (user.value.email) {
      return user.value.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  })

  const displayName = computed(() => {
    if (!user.value) return 'User'
    if (user.value.firstName && user.value.lastName) {
      return `${user.value.firstName} ${user.value.lastName}`
    }
    return user.value.username || user.value.email || 'User'
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
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage
                v-if="user?.profilePicture?.url"
                :src="user.profilePicture.url"
                :alt="displayName"
                class="rounded-lg"
              />
              <AvatarFallback class="rounded-lg">
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 overflow-hidden text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ displayName }}</span>
              <span class="truncate text-xs">{{ user?.email }}</span>
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
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage
                  v-if="user?.profilePicture?.url"
                  :src="user.profilePicture.url"
                  :alt="displayName"
                  class="rounded-lg"
                />
                <AvatarFallback class="rounded-lg">
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ displayName }}</span>
                <span class="truncate text-xs">{{ user?.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <NuxtLink to="/settings/profile" class="flex w-full items-center gap-2">
                <User class="size-4" />
                Profile
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <NuxtLink to="/settings" class="flex w-full items-center gap-2">
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
