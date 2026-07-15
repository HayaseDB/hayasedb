<script setup lang="ts">
import type { AnimeLightboxItem } from '../../composables/useAnimeLightbox'

interface CarouselApi {
  scrollTo: (index: number, jump?: boolean) => void
}

const props = defineProps<{
  items: AnimeLightboxItem[]
}>()

const mainCarousel = useTemplateRef<{ emblaApi?: CarouselApi } | null>(
  'mainCarousel',
)
const thumbCarousel = useTemplateRef<{ emblaApi?: CarouselApi } | null>(
  'thumbCarousel',
)
const activeIndex = ref(0)

watch(
  () => props.items,
  () => {
    activeIndex.value = 0
    mainCarousel.value?.emblaApi?.scrollTo(0, true)
    thumbCarousel.value?.emblaApi?.scrollTo(0, true)
  },
)

function onSelect(index: number) {
  activeIndex.value = index
  thumbCarousel.value?.emblaApi?.scrollTo(index)
}

function selectThumb(index: number) {
  mainCarousel.value?.emblaApi?.scrollTo(index)
}

const lightbox = useAnimeLightbox()

function openLightbox(index: number) {
  lightbox.open({
    items: props.items,
    startIndex: index,
    onNavigate: (nextIndex: number) => {
      mainCarousel.value?.emblaApi?.scrollTo(nextIndex, true)
    },
  })
}
</script>

<template>
  <div v-if="items.length" class="flex flex-col gap-3">
    <div class="relative">
      <UCarousel
        v-if="items.length > 1"
        ref="mainCarousel"
        :items="items"
        arrows
        loop
        :ui="{ prev: 'sm:start-4', next: 'sm:end-4' }"
        @select="onSelect"
      >
        <template #default="{ item, index }">
          <button
            type="button"
            class="block w-full cursor-zoom-in rounded-lg"
            :aria-label="`Open ${item.alt} in fullscreen`"
            @click="openLightbox(index)"
          >
            <div class="aspect-video w-full overflow-hidden rounded-lg">
              <AnimeCoverImage :src="item.url" :alt="item.alt" lazy />
            </div>
          </button>
        </template>
      </UCarousel>

      <button
        v-else
        type="button"
        class="block w-full cursor-zoom-in rounded-lg"
        :aria-label="`Open ${items[0]!.alt} in fullscreen`"
        @click="openLightbox(0)"
      >
        <div class="aspect-video w-full overflow-hidden rounded-lg">
          <AnimeCoverImage :src="items[0]!.url" :alt="items[0]!.alt" lazy />
        </div>
      </button>

      <UBadge
        v-if="items.length > 1"
        color="neutral"
        variant="solid"
        size="sm"
        class="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/60 text-white tabular-nums"
      >
        {{ activeIndex + 1 }} / {{ items.length }}
      </UBadge>
    </div>

    <UCarousel
      v-if="items.length > 1"
      ref="thumbCarousel"
      :items="items"
      align="start"
      :ui="{ item: 'basis-auto' }"
    >
      <template #default="{ item, index }">
        <button
          type="button"
          class="w-20 overflow-hidden rounded-md transition-opacity sm:w-24"
          :class="
            index === activeIndex
              ? 'opacity-100'
              : 'opacity-40 hover:opacity-100'
          "
          :aria-label="`Go to image ${index + 1}`"
          @click="selectThumb(index)"
        >
          <div class="aspect-video w-full">
            <AnimeCoverImage :src="item.url" :alt="item.alt" lazy />
          </div>
        </button>
      </template>
    </UCarousel>
  </div>
</template>
