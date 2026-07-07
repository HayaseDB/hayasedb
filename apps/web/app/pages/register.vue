<template>
  <AuthCard>
    <AuthRegisterForm :providers="['github']">
      <template #footer>
        Already have an account?
        <ULink to="/login" class="text-primary">Sign in</ULink>
      </template>
    </AuthRegisterForm>
  </AuthCard>
</template>
