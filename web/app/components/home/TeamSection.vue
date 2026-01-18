<script setup lang="ts">
  import type { TeamMember } from '#shared/types'
  import type { Component } from 'vue'
  import { Card, CardContent } from '@/components/ui/card'
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { Heart, Globe } from 'lucide-vue-next'
  import {
    GitHubIcon,
    InstagramIcon,
    DiscordIcon,
    XIcon,
    TikTokIcon,
    YouTubeIcon,
    TwitchIcon,
  } from 'vue3-simple-icons'

  const teamMembers: TeamMember[] = [
    {
      name: 'AIO',
      role: 'Developer',
      image: '/team/AIO.gif',
      socials: {
        github: 'https://github.com/aiomayo',
        website: 'https://aio-web.xyz',
        instagram: 'https://instagram.com/aio_dev',
      },
    },
  ]

  const socialIcons: Record<string, Component> = {
    github: GitHubIcon,
    website: Globe,
    x: XIcon,
    instagram: InstagramIcon,
    tiktok: TikTokIcon,
    youtube: YouTubeIcon,
    twitch: TwitchIcon,
    discord: DiscordIcon,
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function getSocialLinks(socials: TeamMember['socials']) {
    return Object.entries(socials)
      .filter(([_, href]) => href)
      .map(([platform, href]) => ({
        platform,
        href: href!,
        icon: socialIcons[platform],
      }))
  }
</script>

<template>
  <section class="px-4 py-12 sm:py-16">
    <div class="mx-auto max-w-5xl">
      <div class="mb-4 flex items-center justify-center gap-2">
        <h2 class="text-center text-3xl font-semibold sm:text-4xl md:text-5xl">The Team</h2>
        <Heart
          class="text-destructive size-8 animate-pulse sm:size-10 md:size-12"
          fill="currentColor"
        />
      </div>

      <p
        class="text-muted-foreground mx-auto mb-10 max-w-2xl text-center text-sm leading-relaxed sm:mb-12 sm:text-base md:text-lg"
      >
        We are proud to offer HayaseDB to you. As passionate young developers and designers, we
        dedicate ourselves to this project to provide value to our community.
      </p>

      <div class="flex flex-wrap justify-center gap-6">
        <Card v-for="member in teamMembers" :key="member.name" class="w-full max-w-xs">
          <CardContent class="flex flex-col items-center p-6 text-center">
            <Avatar class="mb-4 size-24 sm:size-28 md:size-32">
              <AvatarImage :src="member.image" :alt="member.name" />
              <AvatarFallback class="text-xl sm:text-2xl">{{
                getInitials(member.name)
              }}</AvatarFallback>
            </Avatar>

            <h3 class="text-lg font-bold sm:text-xl">{{ member.name }}</h3>
            <p class="text-muted-foreground mb-4 text-sm">{{ member.role }}</p>

            <div class="flex flex-wrap justify-center gap-3">
              <a
                v-for="social in getSocialLinks(member.socials)"
                :key="social.platform"
                :href="social.href"
                :aria-label="social.platform"
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                <component :is="social.icon" class="size-5" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>
