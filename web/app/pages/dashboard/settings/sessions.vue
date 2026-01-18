<script setup lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { SessionsManager } from '@/components/settings'

  const {
    sessions,
    sessionsMeta,
    sessionsSort,
    sessionsOrder,
    sessionsSearch,
    isSessionsLoading,
    handleTerminateSession,
    handleTerminateAllOtherSessions,
    setSessionsPage,
    setSessionsPageSize,
    setSessionsSort,
  } = useSettings()
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
        v-model:search="sessionsSearch"
        :sessions="sessions ?? []"
        :is-loading="isSessionsLoading"
        :meta="sessionsMeta"
        :current-sort="sessionsSort"
        :current-order="sessionsOrder"
        @terminate-session="handleTerminateSession"
        @terminate-all-other-sessions="handleTerminateAllOtherSessions"
        @update:page="setSessionsPage"
        @update:page-size="setSessionsPageSize"
        @update:sort="setSessionsSort"
      />
    </CardContent>
  </Card>
</template>
