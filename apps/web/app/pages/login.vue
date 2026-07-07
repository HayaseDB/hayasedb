<template>
  <AuthCard>
    <AuthLoginForm :providers="['github']">
      <template #footer>
        No account?
        <ULink to="/register" class="text-primary">Create one</ULink>
      </template>
    </AuthLoginForm>
  </AuthCard>
</template>
