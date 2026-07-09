import type { SocialProvider } from '@hayasedb/contract'

export const providerConfig: Record<
  SocialProvider,
  { name: string; label: string; icon: string }
> = {
  github: {
    name: 'GitHub',
    label: 'Continue with GitHub',
    icon: 'i-simple-icons-github',
  },
  discord: {
    name: 'Discord',
    label: 'Continue with Discord',
    icon: 'i-simple-icons-discord',
  },
}
