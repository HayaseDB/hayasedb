<script setup lang="ts">
  import { Cropper } from 'vue-advanced-cropper'
  import 'vue-advanced-cropper/dist/style.css'
  import { ZoomIn, ZoomOut, Loader2 } from 'lucide-vue-next'
  import { useMediaQuery } from '@vueuse/core'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'

  const isMobile = useMediaQuery('(max-width: 640px)')

  const props = defineProps<{
    open: boolean
    file: File | null
  }>()

  const emit = defineEmits<{
    'update:open': [value: boolean]
    crop: [blob: Blob]
  }>()

  const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
  const imageSrc = ref('')
  const isProcessing = ref(false)

  watch(
    () => [props.open, props.file] as const,
    async ([open, file]) => {
      if (!open) {
        imageSrc.value = ''
        return
      }
      if (file) {
        imageSrc.value = await readFileAsDataURL(file)
        await nextTick()
        cropperRef.value?.reset()
      }
    },
    { immediate: true },
  )

  function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve((e.target?.result as string) || '')
      reader.readAsDataURL(file)
    })
  }

  function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number,
  ): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  }

  async function applyCrop() {
    const { canvas } = cropperRef.value?.getResult() ?? {}
    if (!canvas) return

    isProcessing.value = true

    const output = document.createElement('canvas')
    output.width = output.height = 512
    output.getContext('2d')?.drawImage(canvas, 0, 0, 512, 512)

    const blob = await canvasToBlob(output, 'image/webp', 0.9)
    if (blob) {
      emit('crop', blob)
      emit('update:open', false)
    }

    isProcessing.value = false
  }

  function close() {
    emit('update:open', false)
  }
</script>

<template>
  <Dialog :open="open" @update:open="close">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Crop Image</DialogTitle>
        <DialogDescription>
          {{
            isMobile
              ? 'Pinch to zoom, drag image to reposition'
              : 'Drag to reposition, scroll to zoom'
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="bg-muted relative h-80 w-full overflow-hidden rounded-md">
          <Cropper
            v-if="imageSrc"
            ref="cropperRef"
            class="cropper"
            :src="imageSrc"
            :stencil-size="isMobile ? { width: 280, height: 280 } : undefined"
            :stencil-props="
              isMobile
                ? { handlers: {}, movable: false, resizable: false, aspectRatio: 1 }
                : { aspectRatio: 1 }
            "
            :image-restriction="isMobile ? 'stencil' : 'fit-area'"
          />
        </div>

        <div v-if="!isMobile" class="flex justify-center gap-2">
          <Button type="button" variant="outline" size="icon" @click="cropperRef?.zoom(0.8)">
            <ZoomOut class="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" @click="cropperRef?.zoom(1.25)">
            <ZoomIn class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isProcessing" @click="close"> Cancel </Button>
        <Button :disabled="isProcessing" @click="applyCrop">
          <Loader2 v-if="isProcessing" class="animate-spin" />
          {{ isProcessing ? 'Processing...' : 'Apply' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
  .cropper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>
