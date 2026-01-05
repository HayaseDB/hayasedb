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
  import AuthFormHeader from './AuthFormHeader.vue'
  import AuthFormFooter from './AuthFormFooter.vue'

  const schema = z
    .object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be at most 50 characters')
        .regex(
          /^[a-zA-Z0-9_-]+$/,
          'Username can only contain letters, numbers, underscores, and hyphens',
        ),
      email: z.email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })

  type FormData = Omit<z.infer<typeof schema>, 'confirmPassword'>

  const props = defineProps<{
    isLoading?: boolean
  }>()

  const emit = defineEmits<{
    submit: [data: FormData]
  }>()

  const { handleSubmit } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(({ confirmPassword: _, ...data }) => {
    emit('submit', data)
  })
</script>

<template>
  <form method="POST" class="flex flex-col" @submit="onSubmit">
    <FieldGroup class="gap-4">
      <AuthFormHeader
        title="Create your account"
        description="Fill in the form below to create your account"
      />

      <div class="grid grid-cols-2 gap-4">
        <VeeField v-slot="{ field, errors }" name="firstName">
          <Field :data-invalid="!!errors.length">
            <FieldLabel for="firstName">First Name</FieldLabel>
            <Input
              id="firstName"
              v-bind="field"
              type="text"
              placeholder="Hayase"
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
              placeholder="Nagatoro"
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
            placeholder="hayase"
            :disabled="props.isLoading"
            :aria-invalid="!!errors.length"
          />
          <FieldDescription
            >3-50 characters, letters, numbers, underscores, and dashes.</FieldDescription
          >
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
            placeholder="hayase.nagatoro@gmail.com"
            :disabled="props.isLoading"
            :aria-invalid="!!errors.length"
          />
          <FieldDescription>We'll send a verification email to this address.</FieldDescription>
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="password">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="password">Password</FieldLabel>
          <Input
            id="password"
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
          <FieldLabel for="confirmPassword">Confirm Password</FieldLabel>
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

      <Button type="submit" class="w-full" :disabled="props.isLoading">
        <Loader2 v-if="props.isLoading" class="animate-spin" />
        {{ props.isLoading ? 'Creating account...' : 'Create Account' }}
      </Button>

      <AuthFormFooter mode="register" />
    </FieldGroup>
  </form>
</template>
