<script setup lang="ts">
  import { Compass, Home, LayoutDashboard } from 'lucide-vue-next'

  import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
  } from '@/components/ui/navigation-menu'
  import { cn } from '@/utils/cn'
  import NavbarListItem from './NavbarListItem.vue'

  const { exploreItems } = useNavigation()
</script>

<template>
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuLink as-child>
          <NuxtLink to="/" :class="cn(navigationMenuTriggerStyle(), 'flex-row gap-1.5')">
            <Home class="size-4" />
            Home
          </NuxtLink>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuTrigger class="gap-1.5">
          <Compass class="size-4" />
          Explore
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="grid gap-3 p-4 md:w-100 lg:w-125 lg:grid-cols-[.75fr_1fr]">
            <li class="row-span-4">
              <NavigationMenuLink as-child>
                <NuxtLink
                  to="/"
                  class="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-none select-none focus:shadow-md"
                >
                  <img src="~/assets/svg/icon-rounded.svg" alt="HayaseDB" class="size-12" />
                  <div class="mt-4 mb-2 text-lg font-medium">HayaseDB</div>
                  <p class="text-muted-foreground text-sm leading-tight">
                    Your comprehensive anime and manga database. Discover, track, and explore.
                  </p>
                </NuxtLink>
              </NavigationMenuLink>
            </li>
            <NavbarListItem
              v-for="item in exploreItems"
              :key="item.href"
              :to="item.href"
              :title="item.title"
              :icon="item.icon"
            >
              {{ item.description }}
            </NavbarListItem>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink as-child>
          <NuxtLink to="/dashboard" :class="cn(navigationMenuTriggerStyle(), 'flex-row gap-1.5')">
            <LayoutDashboard class="size-4" />
            Dashboard
          </NuxtLink>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
