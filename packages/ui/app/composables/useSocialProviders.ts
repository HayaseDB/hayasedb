import type { SocialProvider } from '@hayasedb/contract'

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
