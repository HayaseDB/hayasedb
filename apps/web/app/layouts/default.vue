<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <UMain class="flex-1">
      <slot />
    </UMain>

    <AppFooter />
  </div>
</template>
