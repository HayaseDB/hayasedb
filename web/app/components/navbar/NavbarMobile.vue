<script setup lang="ts">
  import { ChevronDown, Home, LayoutDashboard, LogOut, Menu, Settings, User } from 'lucide-vue-next'

  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { Button } from '@/components/ui/button'
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
  import { Separator } from '@/components/ui/separator'
  import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from '@/components/ui/sheet'
  import RoleBadge from '@/components/RoleBadge.vue'
  import NavbarLogo from './NavbarLogo.vue'

  const { exploreItems } = useNavigation()
  const { user, isAuthenticated, logout } = useAuth()

  const userInitials = computed(() => user.value?.username?.[0]?.toUpperCase() ?? 'U')
  const displayName = computed(() => user.value?.username ?? 'User')

  const open = ref(false)
  const exploreOpen = ref(false)

  const handleLogout = async () => {
    open.value = false
    await logout()
    await navigateTo('/auth/login')
  }
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <Button variant="ghost" size="icon">
        <Menu class="size-5" />
        <span class="sr-only">Toggle menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="right" class="w-80 overflow-y-auto">
      <SheetHeader class="text-left">
        <SheetTitle>
          <NavbarLogo />
        </SheetTitle>
      </SheetHeader>

      <nav class="mt-6 flex flex-col gap-1">
        <SheetClose as-child>
          <NuxtLink
            to="/"
            class="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            <Home class="size-4" />
            Home
          </NuxtLink>
        </SheetClose>

        <Collapsible v-model:open="exploreOpen">
          <CollapsibleTrigger as-child>
            <button
              class="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              <span>Explore</span>
              <ChevronDown
                class="size-4 transition-transform duration-200"
                :class="{ 'rotate-180': exploreOpen }"
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="mt-1 ml-4 flex flex-col gap-1 border-l pl-4">
              <SheetClose v-for="item in exploreItems" :key="item.href" as-child>
                <NuxtLink
                  :to="item.href"
                  class="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                >
                  <component :is="item.icon" class="size-4" />
                  {{ item.title }}
                </NuxtLink>
              </SheetClose>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <SheetClose as-child>
          <NuxtLink
            to="/dashboard"
            class="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            <LayoutDashboard class="size-4" />
            Dashboard
          </NuxtLink>
        </SheetClose>
      </nav>

      <Separator class="my-4" />

      <div class="flex flex-col gap-2">
        <template v-if="isAuthenticated">
          <div class="flex items-center gap-3 rounded-md px-3 py-2">
            <Avatar class="size-10">
              <AvatarImage
                v-if="user?.profilePicture?.url"
                :src="user.profilePicture.url"
                :alt="displayName"
              />
              <AvatarFallback>{{ userInitials }}</AvatarFallback>
            </Avatar>
            <div class="flex-1 overflow-hidden">
              <div class="flex items-center gap-1.5">
                <p class="truncate text-sm font-medium">{{ displayName }}</p>
                <RoleBadge v-if="user?.role" :role="user.role" size="sm" />
              </div>
              <p class="text-muted-foreground truncate text-xs">{{ user?.email }}</p>
            </div>
          </div>

          <Separator class="my-2" />

          <SheetClose as-child>
            <NuxtLink
              to="/dashboard/settings"
              class="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <User class="size-4" />
              Account
            </NuxtLink>
          </SheetClose>
          <SheetClose as-child>
            <NuxtLink
              to="/dashboard/settings"
              class="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <Settings class="size-4" />
              Settings
            </NuxtLink>
          </SheetClose>

          <Separator class="my-2" />

          <button
            class="text-destructive hover:bg-destructive/10 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
            @click="handleLogout"
          >
            <LogOut class="size-4" />
            Log out
          </button>
        </template>

        <template v-else>
          <SheetClose as-child>
            <Button as-child variant="outline" class="w-full">
              <NuxtLink to="/auth/login">Sign In</NuxtLink>
            </Button>
          </SheetClose>
          <SheetClose as-child>
            <Button as-child class="w-full">
              <NuxtLink to="/auth/register">Sign Up</NuxtLink>
            </Button>
          </SheetClose>
        </template>
      </div>
    </SheetContent>
  </Sheet>
</template>
