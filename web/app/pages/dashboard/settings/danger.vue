<script setup lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { DangerZone } from '@/components/settings'

  const { deleteLoading, handleAccountDelete } = useSettings()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-destructive">Danger Zone</CardTitle>
      <CardDescription>Irreversible and destructive actions.</CardDescription>
    </CardHeader>
    <CardContent>
      <DangerZone :is-loading="deleteLoading" @submit="handleAccountDelete" />
    </CardContent>
  </Card>
</template>
