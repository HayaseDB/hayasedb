import type { ContributionDisplay } from '@hayasedb/contract'
import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from '#imports'

const CONTRIBUTION_DISPLAY: InjectionKey<ComputedRef<ContributionDisplay>> =
  Symbol('contributionDisplay')

const EMPTY_DISPLAY: ContributionDisplay = { refs: {}, mediaAssets: {} }

export function provideContributionDisplay(
  display: MaybeRefOrGetter<ContributionDisplay | null | undefined>,
): void {
  provide(
    CONTRIBUTION_DISPLAY,
    computed(() => toValue(display) ?? EMPTY_DISPLAY),
  )
}

export function useContributionDisplay(): ComputedRef<ContributionDisplay> {
  return inject(
    CONTRIBUTION_DISPLAY,
    computed(() => EMPTY_DISPLAY),
  )
}
