<script setup lang="ts">
  import { AlertTriangle, Loader2 } from 'lucide-vue-next'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog'

  type FormData = { password: string }

  const props = defineProps<{
    isLoading?: boolean
  }>()

  const emit = defineEmits<{
    submit: [data: FormData]
  }>()

  const dialogOpen = ref(false)
  const password = ref('')
  const error = ref('')
  const hasAttemptedSubmit = ref(false)

  function handleSubmit(e: Event) {
    e.preventDefault()
    hasAttemptedSubmit.value = true

    if (!password.value.trim()) {
      error.value = 'Password is required'
      return
    }

    error.value = ''
    emit('submit', { password: password.value })
  }

  function resetForm() {
    password.value = ''
    error.value = ''
    hasAttemptedSubmit.value = false
  }

  watch(dialogOpen, () => {
    resetForm()
  })

  const showError = computed(() => hasAttemptedSubmit.value && error.value)
  const canSubmit = computed(() => password.value.trim().length > 0)
</script>

<template>
  <div class="space-y-4">
    <div
      class="border-destructive/50 bg-destructive/5 flex items-start gap-4 rounded-lg border p-4"
    >
      <AlertTriangle class="text-destructive mt-0.5 h-5 w-5 shrink-0" />
      <div class="space-y-1">
        <h4 class="text-destructive font-medium">Delete Account</h4>
        <p class="text-muted-foreground text-sm">
          Once you delete your account, there is no going back. This action is permanent and will
          remove all your data, including your profile, contributions, and settings.
        </p>
      </div>
    </div>

    <AlertDialog v-model:open="dialogOpen">
      <AlertDialogTrigger as-child>
        <Button variant="destructive"> Delete Account </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form @submit="handleSubmit">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all
              your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div class="space-y-2 py-4">
            <Label for="delete-password">Enter your password to confirm</Label>
            <Input
              id="delete-password"
              v-model="password"
              type="password"
              placeholder="Your password"
              :disabled="props.isLoading"
              :class="{ 'border-destructive': showError }"
            />
            <p v-if="showError" class="text-destructive text-sm">
              {{ error }}
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel :disabled="props.isLoading">Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive" :disabled="!canSubmit || props.isLoading">
              <Loader2 v-if="props.isLoading" class="animate-spin" />
              {{ props.isLoading ? 'Deleting...' : 'Delete Account' }}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
