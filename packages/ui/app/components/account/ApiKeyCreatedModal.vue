<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    apiKey?: string
    docsUrl?: string | null
  }>(),
  {
    apiKey: '',
    docsUrl: null,
  },
)

const emit = defineEmits<{ close: [boolean] }>()

const copyState = ref<'idle' | 'copied' | 'failed'>('idle')
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function copyKey() {
  try {
    await navigator.clipboard.writeText(props.apiKey)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'failed'
  }
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copyState.value = 'idle'
  }, 1500)
}

onUnmounted(() => clearTimeout(copyTimer))
</script>

<template>
  <UModal
    title="API key created"
    description="This is the only time the full key is shown."
    :dismissible="false"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Store it now"
          description="For security reasons the key cannot be displayed again. If you lose it, delete it and create a new one."
        />
        <UFieldGroup class="w-full">
          <UInput
            :model-value="apiKey"
            readonly
            aria-label="API key"
            class="min-w-0 flex-1 font-mono"
            :ui="{ base: 'text-xs' }"
          />
          <UButton
            :color="copyState === 'failed' ? 'warning' : 'neutral'"
            variant="subtle"
            :icon="copyState === 'copied' ? 'i-lucide-check' : 'i-lucide-copy'"
            :label="
              copyState === 'copied'
                ? 'Copied'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy'
            "
            @click="copyKey"
          />
        </UFieldGroup>
        <p class="text-muted text-sm">
          Send it with the <code class="font-mono text-xs">x-api-key</code>
          header.
          <template v-if="docsUrl">
            See the
            <NuxtLink :to="docsUrl" class="text-primary hover:underline"
              >API documentation</NuxtLink
            >
            for the available endpoints.
          </template>
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton label="Done" color="neutral" @click="emit('close', true)" />
      </div>
    </template>
  </UModal>
</template>
