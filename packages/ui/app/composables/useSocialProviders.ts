import type { SocialProvider } from '@hayasedb/contract'

const providerConfig: Record<SocialProvider, { label: string; icon: string }> =
  {
    github: { label: 'Continue with GitHub', icon: 'i-simple-icons-github' },
    discord: { label: 'Continue with Discord', icon: 'i-simple-icons-discord' },
  }

export function useSocialProviders(
  providers: MaybeRefOrGetter<SocialProvider[]>,
  onSelect: (provider: SocialProvider) => void,
) {
  return computed(() =>
    toValue(providers).map((provider) => ({
      ...providerConfig[provider],
      onClick: () => onSelect(provider),
    })),
  )
}
