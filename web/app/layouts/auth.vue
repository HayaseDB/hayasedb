<template>
  <div class="bg-background text-foreground grid min-h-svh lg:grid-cols-2">
    <div class="flex flex-col gap-4 p-6 md:p-10">
      <div class="flex justify-center md:justify-start">
        <NuxtLink to="/" class="flex items-center gap-1 text-lg font-semibold md:gap-2 md:text-2xl">
          <img
            src="~/assets/svg/icon-rounded.svg"
            alt="HayaseDB"
            class="size-8 rounded-lg md:size-12"
          />
          HayaseDB
        </NuxtLink>
      </div>
      <div class="flex flex-1 items-center justify-center">
        <div class="w-full max-w-xs">
          <slot />
        </div>
      </div>
    </div>
    <div class="relative hidden overflow-hidden bg-zinc-900 lg:block">
      <AuthAnimeScrollWall />
    </div>
  </div>
</template>
