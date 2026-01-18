<script setup lang="ts">
  import { LayoutDashboard, LogOut, Settings } from 'lucide-vue-next'

  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
  import RoleBadge from '@/components/RoleBadge.vue'

  const { user, logout } = useAuth()

  const userInitials = computed(() => user.value?.username?.[0]?.toUpperCase() ?? 'U')
  const displayName = computed(() => user.value?.username ?? 'User')

  const handleLogout = async () => {
    await logout()
    await navigateTo('/auth/login')
  }
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="relative size-9 rounded-full">
        <Avatar class="size-9">
          <AvatarImage
            v-if="user?.profilePicture?.url"
            :src="user.profilePicture.url"
            :alt="displayName"
          />
          <AvatarFallback>{{ userInitials }}</AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56 rounded-lg" side="bottom" align="end" :side-offset="8">
      <DropdownMenuLabel class="p-0 font-normal">
        <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar class="size-8">
            <AvatarImage
              v-if="user?.profilePicture?.url"
              :src="user.profilePicture.url"
              :alt="displayName"
            />
            <AvatarFallback>{{ userInitials }}</AvatarFallback>
          </Avatar>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <div class="flex items-center gap-1.5">
              <span class="truncate font-semibold">{{ displayName }}</span>
              <RoleBadge v-if="user?.role" :role="user.role" size="sm" />
            </div>
            <span class="text-muted-foreground truncate text-xs">{{ user?.email }}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem as-child>
          <NuxtLink to="/dashboard" class="flex w-full items-center gap-2">
            <LayoutDashboard class="size-4" />
            Dashboard
          </NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem as-child>
          <NuxtLink to="/dashboard/settings" class="flex w-full items-center gap-2">
            <Settings class="size-4" />
            Settings
          </NuxtLink>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogout">
        <LogOut class="size-4" />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
