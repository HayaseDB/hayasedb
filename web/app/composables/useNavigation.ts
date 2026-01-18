import { BookOpen, Film, Tv, Users } from 'lucide-vue-next'
import type { Component } from 'vue'

export interface NavItem {
  title: string
  href: string
  description: string
  icon: Component
}

export function useNavigation() {
  const exploreItems: NavItem[] = [
    {
      title: 'Anime',
      href: '/anime',
      description: 'Browse anime series and movies',
      icon: Tv,
    },
    {
      title: 'Manga',
      href: '/manga',
      description: 'Discover manga and light novels',
      icon: BookOpen,
    },
    {
      title: 'Characters',
      href: '/characters',
      description: 'Explore character profiles',
      icon: Users,
    },
    {
      title: 'Studios',
      href: '/studios',
      description: 'View animation studios',
      icon: Film,
    },
  ]

  return {
    exploreItems,
  }
}
