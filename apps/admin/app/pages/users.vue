<script setup lang="ts">
useSeoMeta({ title: 'Users' })
</script>

<template>
  <UDashboardPanel id="admin-users">
    <template #header>
      <UDashboardNavbar title="Users">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="text-muted text-sm">User management coming soon.</p>
    </template>
  </UDashboardPanel>
</template>
