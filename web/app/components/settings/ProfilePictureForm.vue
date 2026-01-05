<script setup lang="ts">
  import { Loader2, Upload, Trash2 } from 'lucide-vue-next'
  import { toast } from 'vue-sonner'
  import { Button } from '@/components/ui/button'
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import ImageCropDialog from './ImageCropDialog.vue'

  const MAX_FILE_SIZE = 5 * 1024 * 1024
  const VALID_TYPES = ['image/png', 'image/jpeg', 'image/webp']

  defineProps<{
    currentPicture?: { url: string | null } | null
    userInitials: string
    isLoading?: boolean
  }>()

  const emit = defineEmits<{
    upload: [file: File]
    delete: []
  }>()

  const fileInput = ref<HTMLInputElement | null>(null)
  const showCropDialog = ref(false)
  const selectedFile = ref<File | null>(null)

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB')
      target.value = ''
      return
    }

    if (!VALID_TYPES.includes(file.type)) {
      toast.error('File must be PNG, JPEG, or WebP')
      target.value = ''
      return
    }

    selectedFile.value = file
    showCropDialog.value = true
    target.value = ''
  }

  function handleCrop(blob: Blob) {
    const file = new File([blob], 'profile-picture.webp', {
      type: 'image/webp',
    })
    emit('upload', file)
  }

  function triggerFileInput() {
    fileInput.value?.click()
  }

  function handleDelete() {
    emit('delete')
  }
</script>

<template>
  <div class="flex items-center gap-6">
    <Avatar :key="currentPicture?.url ?? 'fallback'" class="h-24 w-24">
      <AvatarImage
        v-if="currentPicture?.url"
        :src="currentPicture.url"
        alt="Profile picture"
        class="object-cover"
      />
      <AvatarFallback class="text-2xl">{{ userInitials }}</AvatarFallback>
    </Avatar>

    <div class="flex flex-col gap-3">
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="hidden"
        @change="handleFileSelect"
      />

      <div class="flex gap-2">
        <Button type="button" variant="outline" :disabled="isLoading" @click="triggerFileInput">
          <Loader2 v-if="isLoading" class="animate-spin" />
          <Upload v-else class="h-4 w-4" />
          {{ isLoading ? 'Uploading...' : 'Upload new picture' }}
        </Button>

        <Button
          v-if="currentPicture"
          type="button"
          variant="outline"
          :disabled="isLoading"
          @click="handleDelete"
        >
          <Trash2 class="h-4 w-4" />
          Remove
        </Button>
      </div>

      <p class="text-muted-foreground text-sm">
        PNG, JPEG or WebP. Max 5MB. Will be cropped to 512x512.
      </p>
    </div>

    <ImageCropDialog v-model:open="showCropDialog" :file="selectedFile" @crop="handleCrop" />
  </div>
</template>
