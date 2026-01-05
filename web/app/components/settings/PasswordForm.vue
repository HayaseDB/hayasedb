<script setup lang="ts">
  import { toTypedSchema } from '@vee-validate/zod'
  import { useForm, Field as VeeField } from 'vee-validate'
  import { z } from 'zod'
  import { Loader2 } from 'lucide-vue-next'
  import { Button } from '@/components/ui/button'
  import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
  } from '@/components/ui/field'
  import { Input } from '@/components/ui/input'

  const schema = z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })

  type FormData = { currentPassword: string; newPassword: string }

  const props = defineProps<{
    isLoading?: boolean
  }>()

  const emit = defineEmits<{
    submit: [data: FormData]
  }>()

  const { handleSubmit, resetForm, meta } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(({ confirmPassword: _, ...data }) => {
    emit('submit', data)
  })

  defineExpose({ reset: resetForm })
</script>

<template>
  <form class="flex flex-col" @submit="onSubmit">
    <FieldGroup class="gap-4">
      <VeeField v-slot="{ field, errors }" name="currentPassword">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="currentPassword">Current Password</FieldLabel>
          <Input
            id="currentPassword"
            v-bind="field"
            type="password"
            :disabled="props.isLoading"
            :aria-invalid="!!errors.length"
          />
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="newPassword">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="newPassword">New Password</FieldLabel>
          <Input
            id="newPassword"
            v-bind="field"
            type="password"
            :disabled="props.isLoading"
            :aria-invalid="!!errors.length"
          />
          <FieldDescription>Must be at least 8 characters.</FieldDescription>
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="confirmPassword">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="confirmPassword">Confirm New Password</FieldLabel>
          <Input
            id="confirmPassword"
            v-bind="field"
            type="password"
            :disabled="props.isLoading"
            :aria-invalid="!!errors.length"
          />
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <Button type="submit" class="w-fit" :disabled="!meta.dirty || props.isLoading">
        <Loader2 v-if="props.isLoading" class="animate-spin" />
        {{ props.isLoading ? 'Updating...' : 'Update Password' }}
      </Button>
    </FieldGroup>
  </form>
</template>
