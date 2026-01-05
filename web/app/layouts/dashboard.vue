<script setup lang="ts">
  import { Moon, Sun } from 'lucide-vue-next'
  import { computed } from 'vue'

  import AppSidebar from '@/components/AppSidebar.vue'
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from '@/components/ui/breadcrumb'
  import { Button } from '@/components/ui/button'
  import { Separator } from '@/components/ui/separator'
  import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

  const route = useRoute()
  const colorMode = useColorMode()

  interface BreadcrumbItem {
    label: string
    path: string
  }

  const breadcrumbs = computed(() => {
    const crumbs: BreadcrumbItem[] = []

    route.matched.forEach((matchedRoute) => {
      const meta = matchedRoute.meta.breadcrumb as { label: string } | undefined

      if (!meta?.label) return

      let path = matchedRoute.path
      Object.entries(route.params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value as string)
      })

      crumbs.push({ label: meta.label, path })
    })

    return crumbs
  })

  const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
</script>

<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': '16rem',
    }"
  >
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
      >
        <div class="flex flex-1 items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb class="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
                <BreadcrumbLink v-if="index < breadcrumbs.length - 1" as-child>
                  <NuxtLink :to="crumb.path">
                    {{ crumb.label }}
                  </NuxtLink>
                </BreadcrumbLink>
                <BreadcrumbPage v-else>
                  {{ crumb.label }}
                </BreadcrumbPage>
                <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" />
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button variant="ghost" size="icon" @click="toggleTheme">
            <ClientOnly>
              <Sun v-if="colorMode.value === 'dark'" class="h-5 w-5" />
              <Moon v-else class="h-5 w-5" />
              <template #fallback>
                <div class="h-5 w-5" />
              </template>
            </ClientOnly>
          </Button>
        </div>
      </header>
      <div class="flex flex-1 flex-col overflow-hidden px-4 py-6">
        <div class="mx-auto w-full max-w-7xl">
          <slot />
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
