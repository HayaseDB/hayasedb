<script setup lang="ts">
import type { AnimeRelation } from '@hayasedb/contract'

defineProps<{
  relations: AnimeRelation[]
  to: (anime: AnimeRelation['anime']) => string
}>()
</script>

<template>
  <ul class="grid gap-3 sm:grid-cols-2">
    <li
      v-for="relation in relations"
      :key="`${relation.anime.id}:${relation.kind}`"
    >
      <NuxtLink
        :to="to(relation.anime)"
        class="group bg-elevated/50 hover:bg-elevated ring-default flex h-full overflow-hidden rounded-lg ring-1 transition"
      >
        <AnimeCoverImage
          :src="relation.anime.coverUrl"
          :alt="relation.anime.titleEnglish ?? undefined"
          class="h-[6.5rem] w-[4.35rem] shrink-0 rounded-none"
        />
        <div class="flex min-w-0 flex-1 flex-col gap-1 px-3 py-2.5">
          <span class="text-primary text-xs font-medium">
            {{ ANIME_RELATION_VIEW_LABELS[relation.kind] }}
          </span>
          <p
            class="text-highlighted line-clamp-2 text-sm font-medium group-hover:underline"
          >
            {{ relation.anime.titleEnglish }}
          </p>
          <p class="text-muted mt-auto pt-1 text-xs">
            {{
              [
                animeFormatLabel(relation.anime.format),
                animeStatusLabel(relation.anime.status),
              ]
                .filter(Boolean)
                .join(' · ')
            }}
          </p>
        </div>
      </NuxtLink>
    </li>
  </ul>
</template>
