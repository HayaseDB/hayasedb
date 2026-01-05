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

  const optionalField = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((val) => (val === '' || val === undefined ? undefined : val), schema.optional())

  const schema = z.object({
    email: optionalField(z.email('Invalid email address')),
    username: optionalField(
      z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be at most 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscores, and hyphens'),
    ),
    firstName: optionalField(z.string()),
    lastName: optionalField(z.string()),
  })

  type FormData = {
    email?: string
    username?: string
    firstName?: string
    lastName?: string
  }

  const props = defineProps<{
    currentValues: {
      email: string
      username: string
      firstName: string
      lastName: string
    }
    isLoading?: boolean
  }>()

  const emit = defineEmits<{
    submit: [data: FormData]
  }>()

  const { handleSubmit, resetForm, meta } = useForm({
    validationSchema: toTypedSchema(schema),
  })

  const onSubmit = handleSubmit((values) => {
    const data: FormData = {}
    if (values.email) data.email = values.email
    if (values.username) data.username = values.username
    if (values.firstName) data.firstName = values.firstName
    if (values.lastName) data.lastName = values.lastName
    emit('submit', data)
  })

  defineExpose({ reset: resetForm })
</script>

<template>
  <form class="flex flex-col" @submit="onSubmit">
    <FieldGroup class="gap-4">
      <div class="grid grid-cols-2 gap-4">
        <VeeField v-slot="{ field, errors }" name="firstName">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="firstName">First Name</FieldLabel>
            <Input
              id="firstName"
              v-bind="field"
              type="text"
              :placeholder="props.currentValues.firstName"
              :disabled="props.isLoading"
              :aria-invalid="!!errors.length"
            />
            <FieldError v-if="errors.length" :errors="errors" />
          </Field>
        </VeeField>

        <VeeField v-slot="{ field, errors }" name="lastName">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="lastName">Last Name</FieldLabel>
            <Input
              id="lastName"
              v-bind="field"
              type="text"
              :placeholder="props.currentValues.lastName"
              :disabled="props.isLoading"
              :aria-invalid="!!errors.length"
            />
            <FieldError v-if="errors.length" :errors="errors" />
          </Field>
        </VeeField>
      </div>

      <VeeField v-slot="{ field, errors }" name="username">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="username">Username</FieldLabel>
          <Input
            id="username"
            v-bind="field"
            type="text"
            :placeholder="props.currentValues.username"
            :disabled="props.isLoading"
            :aria-invalid="!!errors.length"
          />
          <FieldDescription>
            3-50 characters, letters, numbers, underscores, and dashes.
          </FieldDescription>
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="email">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="email">Email</FieldLabel>
          <Input
            id="email"
            v-bind="field"
            type="email"
            :placeholder="props.currentValues.email"
            :disabled="props.isLoading"
            :aria-invalid="!!errors.length"
          />
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <Button type="submit" class="w-fit" :disabled="!meta.dirty || props.isLoading">
        <Loader2 v-if="props.isLoading" class="animate-spin" />
        {{ props.isLoading ? 'Saving...' : 'Save Changes' }}
      </Button>
    </FieldGroup>
  </form>
</template>
