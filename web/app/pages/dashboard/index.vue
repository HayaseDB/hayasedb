<script setup lang="ts">
  definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth',
    breadcrumb: {
      label: 'Dashboard',
    },
  })

  const { data: session } = useAuth()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">
        Welcome back{{ session?.firstName ? `, ${session.firstName}` : '' }}!
      </p>
    </div>

    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="bg-muted/50 flex aspect-video items-center justify-center rounded-xl">
        <span class="text-muted-foreground">Stats Card 1</span>
      </div>
      <div class="bg-muted/50 flex aspect-video items-center justify-center rounded-xl">
        <span class="text-muted-foreground">Stats Card 2</span>
      </div>
      <div class="bg-muted/50 flex aspect-video items-center justify-center rounded-xl">
        <span class="text-muted-foreground">Stats Card 3</span>
      </div>
    </div>

    <div class="bg-muted/50 flex min-h-[50vh] flex-1 items-center justify-center rounded-xl">
      <span class="text-muted-foreground">Main Content Area</span>
    </div>
  </div>
</template>
