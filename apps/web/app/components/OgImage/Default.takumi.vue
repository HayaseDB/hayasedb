<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: 'HayaseDB',
    description: 'The open anime database.',
  },
)
</script>

<template>
  <div
    class="flex h-full w-full flex-col justify-between bg-black p-20"
    style="font-family: Poppins, sans-serif"
  >
    <div class="flex items-center">
      <AppLogo
        background="#ffffff"
        foreground="#000000"
        width="88"
        height="88"
      />
      <span class="ml-6 text-5xl font-semibold text-white">HayaseDB</span>
    </div>

    <div class="flex flex-col">
      <span class="text-7xl leading-tight font-bold text-white">
        {{ title }}
      </span>
      <span v-if="description" class="mt-6 text-4xl text-neutral-400">
        {{ description }}
      </span>
    </div>

    <div class="flex h-3 w-full bg-violet-500" />
  </div>
</template>
