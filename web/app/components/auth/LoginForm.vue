<script setup lang="ts">
  import { toTypedSchema } from '@vee-validate/zod'
  import { useForm, Field as VeeField } from 'vee-validate'
  import { z } from 'zod'
  import { Loader2 } from 'lucide-vue-next'
  import { Button } from '@/components/ui/button'
  import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
  import { Input } from '@/components/ui/input'
  import AuthFormHeader from './AuthFormHeader.vue'
  import AuthFormFooter from './AuthFormFooter.vue'

  const schema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })

  type FormData = z.infer<typeof schema>

  const props = defineProps<{
    isLoading?: boolean
  }>()

  const emit = defineEmits<{
    submit: [data: FormData]
  }>()

  const { handleSubmit } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    emit('submit', values)
  })
</script>

<template>
  <form class="flex flex-col" @submit="onSubmit">
    <FieldGroup class="gap-4">
      <AuthFormHeader
        title="Welcome back"
        description="Enter your credentials to sign in to your account"
      />

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
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <Button type="submit" class="w-full" :disabled="props.isLoading">
        <Loader2 v-if="props.isLoading" class="animate-spin" />
        {{ props.isLoading ? 'Signing in...' : 'Sign in' }}
      </Button>

      <AuthFormFooter mode="login" />
    </FieldGroup>
  </form>
</template>
