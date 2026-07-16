<script setup lang="ts">
import type { ChangesetStatus } from '@hayasedb/contract'

defineProps<{ status: ChangesetStatus }>()
</script>

<template>
  <UBadge
    :color="CHANGESET_STATUS_COLORS[status]"
    :label="CHANGESET_STATUS_LABELS[status]"
    variant="subtle"
  />
</template>
