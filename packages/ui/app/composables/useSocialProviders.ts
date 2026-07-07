import type { SocialProvider } from '~/composables/useAuthActions'

const providerConfig: Record<SocialProvider, { label: string; icon: string }> =
  {
    github: { label: 'Continue with GitHub', icon: 'i-lucide-github' },
  }

export function useSocialProviders(
  providers: MaybeRefOrGetter<SocialProvider[]>,
) {
  const { signInSocial } = useAuthActions()

  return computed(() =>
    toValue(providers).map((provider) => ({
      ...providerConfig[provider],
      onClick: () => signInSocial(provider),
    })),
  )
}
