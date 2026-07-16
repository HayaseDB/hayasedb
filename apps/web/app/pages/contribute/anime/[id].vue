<script setup lang="ts">
import { isSupersedableStatus } from '@hayasedb/domain'

const api = useApiClient()
const route = useRoute()
const id = computed(() => String(route.params.id))
const { genres } = useGenres()

const { data: anime, error } = await useAsyncData(
  () => `contribute-anime-${id.value}`,
  () => api.anime.getById({ id: id.value }),
  { watch: [id] },
)

if (error.value || !anime.value) {
  throw createError({ statusCode: 404, statusMessage: 'Anime not found' })
}

const from = computed(() =>
  typeof route.query.from === 'string' ? route.query.from : undefined,
)

const { data: prefill } = await useAsyncData(
  () => `contribute-edit-prefill-${from.value ?? 'none'}`,
  async () => {
    if (!from.value) return null
    const changeset = await api.changeset.get({ id: from.value })
    if (
      changeset.changes[0]?.op !== 'update' ||
      changeset.changes[0]?.entityId !== anime.value?.id ||
      !isSupersedableStatus(changeset.status)
    ) {
      return null
    }
    return changeset
  },
)

const title = computed(
  () => anime.value?.titleEnglish ?? anime.value?.slug ?? '',
)

useSeoMeta({
  title: () => `Suggest an edit – ${title.value}`,
})
</script>

<template>
  <UContainer class="py-10">
    <UButton
      :to="`/anime/${anime?.slug}`"
      variant="link"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="mb-4 -ml-2"
    >
      Back to {{ title }}
    </UButton>
    <div class="mb-6 flex flex-col gap-1">
      <h1 class="text-highlighted text-2xl font-semibold">Suggest an edit</h1>
      <p class="text-muted text-sm">
        Propose changes to “{{ title }}”. A moderator reviews them before they
        go live.
      </p>
    </div>
    <ContributionFormCard
      :anime="anime ?? null"
      :genres="genres"
      :prefill="prefill"
    />
  </UContainer>
</template>
