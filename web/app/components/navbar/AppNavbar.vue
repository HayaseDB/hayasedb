<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Skeleton } from '@/components/ui/skeleton'
  import NavbarDesktop from './NavbarDesktop.vue'
  import NavbarLogo from './NavbarLogo.vue'
  import NavbarMobile from './NavbarMobile.vue'
  import NavbarThemeToggle from './NavbarThemeToggle.vue'
  import NavbarUser from './NavbarUser.vue'

  const { isAuthenticated } = useAuth()
</script>

<template>
  <header
    class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur"
  >
    <div
      class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
    >
      <div class="flex items-center gap-6">
        <NavbarLogo />
        <NavbarDesktop class="hidden md:flex" />
      </div>

      <div class="hidden items-center gap-2 md:flex">
        <NavbarThemeToggle />
        <ClientOnly>
          <template v-if="isAuthenticated">
            <NavbarUser />
          </template>
          <template v-else>
            <Button as-child variant="ghost">
              <NuxtLink to="/auth/login">Sign In</NuxtLink>
            </Button>
            <Button as-child>
              <NuxtLink to="/auth/register">Sign Up</NuxtLink>
            </Button>
          </template>
          <template #fallback>
            <Skeleton class="size-9 rounded-full" />
          </template>
        </ClientOnly>
      </div>

      <div class="flex items-center gap-2 md:hidden">
        <NavbarThemeToggle />
        <NavbarMobile />
      </div>
    </div>
  </header>
</template>
