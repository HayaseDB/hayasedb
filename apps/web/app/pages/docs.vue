<script setup lang="ts">
definePageMeta({ layout: 'docs', scrollToTop: false })

useSeoMeta({
  title: 'API documentation',
  description:
    'Reference for the public HayaseDB API: read-only anime, genre and system endpoints.',
})

const route = useRoute()
const frame = useTemplateRef('frame')

const initialSrc = `/_reference${route.hash}`

const syncHash = () => {
  const hash = frame.value?.contentWindow?.location.hash ?? ''
  if (hash === window.location.hash) return
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${window.location.search}${hash}`,
  )
}

let poll: ReturnType<typeof setInterval>

onMounted(() => {
  poll = setInterval(syncHash, 150)
})

onBeforeUnmount(() => clearInterval(poll))
</script>

<template>
  <ClientOnly>
    <iframe
      ref="frame"
      :src="initialSrc"
      title="HayaseDB API reference"
      class="size-full overscroll-none border-0"
      @load="syncHash"
    />
  </ClientOnly>
</template>
