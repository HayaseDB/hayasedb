import type { SocialProvider } from '#ui-layer/composables/useAuthActions'

const providerConfig: Record<SocialProvider, { label: string; icon: string }> =
  {
    github: { label: 'Continue with GitHub', icon: 'i-simple-icons-github' },
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
