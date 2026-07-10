<script setup lang="ts">
const { data: session } = await useAppSession()
const user = computed(() => session.value?.user ?? null)
</script>

<template>
  <UDashboardPanel id="admin-home">
    <template #header>
      <UDashboardNavbar title="Overview">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-1">
        <h2 class="text-highlighted text-xl font-semibold">
          Welcome back{{ user?.name ? `, ${user.name}` : '' }}
        </h2>
        <p class="text-muted text-sm">
          The administration console. Sections will appear here.
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
