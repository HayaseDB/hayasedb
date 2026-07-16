<script setup lang="ts">
import type { AnimeDocumentMedia } from '@hayasedb/contract'
import type { AnimeLightboxItem } from '../../../composables/useAnimeLightbox'

const props = defineProps<{ value: unknown }>()

const display = useContributionDisplay()
const lightbox = useAnimeLightbox()

function isMediaItem(item: unknown): item is AnimeDocumentMedia {
  return (
    !!item &&
    typeof item === 'object' &&
    typeof (item as AnimeDocumentMedia).mediaId === 'string'
  )
}

const items = computed<AnimeDocumentMedia[]>(() =>
  Array.isArray(props.value) ? props.value.filter(isMediaItem) : [],
)

const lightboxItems = computed<AnimeLightboxItem[]>(() =>
  items.value.map((item, index) => ({
    id: `${item.type}-${item.mediaId}-${index}`,
    url: display.value.mediaAssets[item.mediaId]?.url ?? '',
    alt: ANIME_MEDIA_TYPE_LABELS[item.type],
  })),
)

function open(index: number) {
  if (!lightboxItems.value[index]?.url) return
  lightbox.open({ items: lightboxItems.value, startIndex: index })
}
</script>

<template>
  <span class="flex flex-wrap gap-2">
    <span
      v-for="(item, index) in items"
      :key="`${item.type}-${item.mediaId}-${index}`"
      class="flex flex-col items-center gap-1"
    >
      <button
        type="button"
        class="block cursor-zoom-in rounded"
        :aria-label="`Open ${ANIME_MEDIA_TYPE_LABELS[item.type]} in fullscreen`"
        @click="open(index)"
      >
        <AnimeCoverImage
          :src="display.mediaAssets[item.mediaId]?.url"
          :alt="ANIME_MEDIA_TYPE_LABELS[item.type]"
          class="border-default hover:border-primary h-16 w-12 rounded border transition-colors"
        />
      </button>
      <span class="text-muted text-xs">{{
        ANIME_MEDIA_TYPE_LABELS[item.type]
      }}</span>
    </span>
  </span>
</template>
