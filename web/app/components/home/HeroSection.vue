<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { GitHubIcon, InstagramIcon, DiscordIcon, XIcon, TikTokIcon } from 'vue3-simple-icons'

  const socialLinks = [
    { icon: GitHubIcon, href: 'https://github.com/hayasedb', label: 'GitHub' },
    { icon: InstagramIcon, href: 'https://instagram.com/hayasedb', label: 'Instagram' },
    { icon: DiscordIcon, href: 'https://discord.hayasedb.com', label: 'Discord' },
    { icon: XIcon, href: 'https://x.com/hayasedb', label: 'X' },
    { icon: TikTokIcon, href: 'https://tiktok.com/@hayasedb', label: 'TikTok' },
  ]
</script>

<template>
  <section class="px-4 py-12 sm:py-16 md:py-24">
    <div
      class="mx-auto flex max-w-5xl flex-col-reverse items-center gap-8 md:flex-row md:justify-between lg:gap-12"
    >
      <div class="max-w-xl space-y-6 text-center md:text-left">
        <div>
          <h1 class="text-3xl font-light sm:text-4xl md:text-5xl">Welcome to</h1>
          <h2 class="text-primary text-3xl font-semibold sm:text-4xl md:text-5xl">HayaseDB</h2>
        </div>

        <p class="text-muted-foreground text-sm leading-relaxed sm:text-base md:text-lg">
          HayaseDB is a free, open source anime database that provides comprehensive details through
          a user friendly web platform and a powerful API for developers.
        </p>

        <div class="flex flex-wrap justify-center gap-4 md:justify-start">
          <a
            v-for="link in socialLinks"
            :key="link.label"
            :href="link.href"
            :aria-label="link.label"
            target="_blank"
            rel="noopener noreferrer"
            class="text-muted-foreground hover:text-primary transition-colors"
          >
            <component :is="link.icon" class="size-5" />
          </a>
        </div>

        <div class="flex flex-wrap justify-center gap-3 md:justify-start">
          <Button as-child>
            <NuxtLink to="/explorer">Explorer</NuxtLink>
          </Button>
          <Button as-child variant="secondary">
            <NuxtLink to="/docs">Learn More</NuxtLink>
          </Button>
        </div>
      </div>

      <div class="shrink-0">
        <img
          src="~/assets/mascot.webp"
          alt="HayaseDB Mascot"
          class="w-40 sm:w-48 md:w-56 lg:w-64"
        />
      </div>
    </div>
  </section>
</template>
