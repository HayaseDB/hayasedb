<script setup lang="ts">
import type { AnimeLightboxItem } from '../../composables/useAnimeLightbox'

interface CarouselApi {
  scrollPrev: () => void
  scrollNext: () => void
}

const props = withDefaults(
  defineProps<{
    items: AnimeLightboxItem[]
    startIndex?: number
    onNavigate?: (index: number) => void
  }>(),
  { startIndex: 0, onNavigate: undefined },
)

const emit = defineEmits<{ close: [boolean] }>()

const carousel = useTemplateRef<{ emblaApi?: CarouselApi } | null>('carousel')
const initialIndex = Math.min(
  Math.max(props.startIndex, 0),
  Math.max(props.items.length - 1, 0),
)
const activeIndex = ref(initialIndex)
const activeItem = computed(() => props.items[activeIndex.value])

function onSelect(index: number) {
  activeIndex.value = index
  props.onNavigate?.(index)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') carousel.value?.emblaApi?.scrollPrev()
  else if (event.key === 'ArrowRight') carousel.value?.emblaApi?.scrollNext()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <UModal fullscreen :ui="{ content: 'bg-black/95' }">
    <template #content>
      <div class="relative flex h-full flex-col justify-center">
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="lg"
          aria-label="Close fullscreen view"
          class="absolute top-4 right-4 z-10 rounded-full text-white hover:bg-white/10"
          @click="emit('close', false)"
        />

        <UCarousel
          v-if="items.length > 1"
          ref="carousel"
          :items="items"
          :start-index="startIndex"
          arrows
          loop
          :ui="{ prev: 'sm:start-4', next: 'sm:end-4' }"
          @select="onSelect"
        >
          <template #default="{ item }">
            <div class="flex h-full items-center justify-center p-4 sm:p-12">
              <img
                :src="item.url"
                :alt="item.alt"
                class="max-h-[85vh] max-w-full object-contain"
              />
            </div>
          </template>
        </UCarousel>

        <div
          v-else-if="activeItem"
          class="flex h-full items-center justify-center p-4 sm:p-12"
        >
          <img
            :src="activeItem.url"
            :alt="activeItem.alt"
            class="max-h-[85vh] max-w-full object-contain"
          />
        </div>

        <UBadge
          v-if="items.length > 1"
          color="neutral"
          variant="solid"
          size="lg"
          class="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/10 text-white tabular-nums"
        >
          {{ activeIndex + 1 }} / {{ items.length }}
        </UBadge>
      </div>
    </template>
  </UModal>
</template>
