<script setup lang="ts">
import { Motion, useReducedMotion } from 'motion-v'

const api = useApiClient()
const reducedMotion = useReducedMotion()

const { data } = await useAsyncData('landing-anime', () =>
  api.anime.list({ limit: 30, sort: 'recent', order: 'desc' }),
)
const { data: liveStats } = await useSystemStats()

const marqueeItems = computed(() =>
  (data.value?.items ?? []).filter((anime) => anime.coverUrl),
)
const recentItems = computed(() => (data.value?.items ?? []).slice(0, 6))

useSeoMeta({
  description:
    'The open anime database. Built and reviewed by the community, free to explore and free to use through an open API.',
  ogTitle: 'HayaseDB: The open anime database',
  ogDescription:
    'The open anime database. Built and reviewed by the community, free to explore and free to use through an open API.',
})

const heroMotion = computed(() => {
  if (reducedMotion.value) {
    const off = { initial: false as const }
    return { badge: off, title: off, description: off, links: off }
  }
  const ease = [0.22, 1, 0.36, 1] as const
  return {
    badge: {
      initial: { opacity: 0, y: 12, scale: 0.9 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: {
        type: 'spring' as const,
        stiffness: 320,
        damping: 22,
        delay: 0,
      },
    },
    title: {
      initial: { opacity: 0, y: 28, filter: 'blur(10px)' },
      animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
      transition: { duration: 0.8, ease, delay: 0.1 },
    },
    description: {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease, delay: 0.25 },
    },
    links: {
      initial: { opacity: 0, y: 16, scale: 0.97 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
        delay: 0.35,
      },
    },
  }
})

const features = [
  {
    icon: 'i-lucide-database',
    title: 'Open data',
    description:
      'Every title, genre and detail is public. No paywalls, no locked content.',
  },
  {
    icon: 'i-lucide-users',
    title: 'Community contributions',
    description:
      'Anyone can propose new entries or improvements through simple change requests.',
  },
  {
    icon: 'i-lucide-code',
    title: 'Developer API',
    description:
      'A typed, documented API gives you the full database for your own projects.',
  },
  {
    icon: 'i-lucide-image',
    title: 'Rich media',
    description:
      'Covers, banners and galleries come with every entry, served from fast storage.',
  },
  {
    icon: 'i-lucide-shield-check',
    title: 'Moderated quality',
    description:
      'Moderators review every change before it goes live, keeping the data reliable.',
  },
  {
    icon: 'i-simple-icons-github',
    title: 'Open source',
    description:
      'The whole platform is developed in the open. Star it, fork it, improve it.',
  },
]

const stats = computed(() => [
  { value: liveStats.value?.anime ?? 0, label: 'Anime titles' },
  { value: liveStats.value?.contributions ?? 0, label: 'Contributions' },
  { value: liveStats.value?.users ?? 0, label: 'Users' },
])

const ctaLinks = [
  { label: 'Create an account', to: '/register' },
  {
    label: 'Browse anime',
    to: '/explore',
    color: 'neutral' as const,
    variant: 'outline' as const,
  },
]
</script>

<template>
  <div>
    <UPageHero title="HayaseDB">
      <template #headline>
        <Motion v-bind="heroMotion.badge">
          <UBadge variant="subtle" size="lg">Open source</UBadge>
        </Motion>
      </template>
      <template #title>
        <Motion as="span" class="inline-block" v-bind="heroMotion.title">
          HayaseDB
        </Motion>
      </template>
      <template #description>
        <Motion as="span" class="inline-block" v-bind="heroMotion.description">
          The open anime database, built by the community.
        </Motion>
      </template>
      <template #links>
        <Motion
          class="flex flex-wrap justify-center gap-3"
          v-bind="heroMotion.links"
        >
          <UButton
            to="/explore"
            label="Explore the database"
            trailing-icon="i-lucide-arrow-right"
            size="xl"
          />
          <UButton
            to="https://github.com/HayaseDB/hayasedb"
            target="_blank"
            icon="i-simple-icons-github"
            color="neutral"
            variant="outline"
            size="xl"
            square
            aria-label="GitHub"
          />
          <UButton
            to="https://discord.gg/eeUSX3s9wZ"
            target="_blank"
            icon="i-simple-icons-discord"
            color="neutral"
            variant="outline"
            size="xl"
            square
            aria-label="Discord"
          />
        </Motion>
      </template>
      <template v-if="marqueeItems.length >= 8" #bottom>
        <LandingCoverMarquee :items="marqueeItems" />
      </template>
    </UPageHero>

    <UPageSection
      headline="Why HayaseDB"
      title="A database that belongs to everyone"
      description="Every entry is public, every change is reviewed and everything is available through the API."
    >
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <MotionReveal
          v-for="(feature, index) in features"
          :key="feature.title"
          pop
          :delay="index * 0.07"
        >
          <UPageFeature v-bind="feature" />
        </MotionReveal>
      </div>
    </UPageSection>

    <UPageSection>
      <LandingStats :stats="stats" />
    </UPageSection>

    <UPageSection
      v-if="recentItems.length > 0"
      headline="Fresh from the community"
      title="Recently added"
    >
      <template #links>
        <UButton
          to="/explore"
          label="View all"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
        />
      </template>
      <div
        class="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6"
      >
        <MotionReveal
          v-for="(anime, index) in recentItems"
          :key="anime.id"
          pop
          :delay="index * 0.06"
        >
          <AnimeCard :anime="anime" :to="`/anime/${anime.slug}`" />
        </MotionReveal>
      </div>
    </UPageSection>

    <MotionReveal pop>
      <UContainer class="pb-24">
        <UPageCTA
          variant="soft"
          title="Help build the open anime database"
          description="Create an account and submit your first contribution. Moderators review every change before it goes live."
          :links="ctaLinks"
        />
      </UContainer>
    </MotionReveal>
  </div>
</template>
