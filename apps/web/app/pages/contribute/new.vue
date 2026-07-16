<script setup lang="ts">
import { isSupersedableStatus } from '@hayasedb/domain'

const api = useApiClient()
const route = useRoute()
const { genres } = useGenres()

const from = computed(() =>
  typeof route.query.from === 'string' ? route.query.from : undefined,
)

const { data: prefill } = await useAsyncData(
  () => `contribute-new-prefill-${from.value ?? 'none'}`,
  async () => {
    if (!from.value) return null
    const changeset = await api.changeset.get({ id: from.value })
    if (
      changeset.changes[0]?.op !== 'create' ||
      !isSupersedableStatus(changeset.status)
    ) {
      return null
    }
    return changeset
  },
)

useSeoMeta({
  title: 'Add anime',
  description: 'Submit a new anime for review.',
})
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-6 flex flex-col gap-1">
      <h1 class="text-highlighted text-2xl font-semibold">Add a new anime</h1>
      <p class="text-muted text-sm">
        Your submission is reviewed by a moderator before it appears on the
        site.
      </p>
    </div>
    <ContributionFormCard :anime="null" :genres="genres" :prefill="prefill" />
  </UContainer>
</template>
