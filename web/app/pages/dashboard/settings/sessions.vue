<script setup lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { SessionsManager } from '@/components/settings'

  const { sessions, isSessionsLoading, handleTerminateSession, handleTerminateAllOtherSessions } =
    useSettings()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Active Sessions</CardTitle>
      <CardDescription>
        Manage your active sessions across all devices. You can terminate sessions you don't
        recognize.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <SessionsManager
        :sessions="sessions ?? []"
        :is-loading="isSessionsLoading"
        @terminate-session="handleTerminateSession"
        @terminate-all-other-sessions="handleTerminateAllOtherSessions"
      />
    </CardContent>
  </Card>
</template>
