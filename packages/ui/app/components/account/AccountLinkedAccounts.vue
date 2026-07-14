<script setup lang="ts">
import type { AccountLinkedRow, SocialProvider } from '@hayasedb/contract'
import { LazyConfirmModal } from '#components'

const props = withDefaults(
  defineProps<{
    accounts?: AccountLinkedRow[]
    availableProviders?: SocialProvider[]
    loading?: boolean
    onLink?: (provider: SocialProvider) => unknown
    onUnlink?: (payload: { providerId: string; accountId: string }) => unknown
  }>(),
  {
    accounts: () => [],
    availableProviders: () => [],
    loading: false,
    onLink: undefined,
    onUnlink: undefined,
  },
)

type LinkedSocial = AccountLinkedRow & { providerId: SocialProvider }

const linked = computed<LinkedSocial[]>(() =>
  props.accounts.filter(
    (account: AccountLinkedRow): account is LinkedSocial =>
      account.providerId in providerConfig,
  ),
)

type ProviderRow = {
  provider: SocialProvider
  name: string
  icon: string
  account: LinkedSocial | null
}

const rows = computed<ProviderRow[]>(() =>
  props.availableProviders.map((provider: SocialProvider) => ({
    provider,
    name: providerConfig[provider].name,
    icon: providerConfig[provider].icon,
    account:
      linked.value.find(
        (account: LinkedSocial) => account.providerId === provider,
      ) ?? null,
  })),
)

const overlay = useOverlay()
const confirmModal = overlay.create(LazyConfirmModal)

function askUnlink(providerId: string, accountId: string) {
  confirmModal.open({
    title: 'Unlink this account?',
    description: "You'll no longer be able to sign in with this provider.",
    confirmLabel: 'Unlink',
    onConfirm: () => props.onUnlink?.({ providerId, accountId }),
  })
}
</script>

<template>
  <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
    <div class="lg:col-span-1">
      <h3 class="text-highlighted text-sm font-medium">Connected accounts</h3>
      <p class="text-muted mt-1 text-sm">
        Sign in faster by linking a social account.
      </p>
    </div>

    <div class="lg:col-span-2">
      <div class="flex flex-col">
        <template v-for="(row, index) in rows" :key="row.provider">
          <USeparator v-if="Number(index) > 0" />
          <div class="flex items-center justify-between gap-4 py-3 first:pt-0">
            <div class="flex min-w-0 items-center gap-3">
              <UIcon :name="row.icon" class="text-muted size-5 shrink-0" />
              <div class="min-w-0">
                <p class="text-highlighted text-sm font-medium">
                  {{ row.name }}
                </p>
                <p class="text-muted text-sm">
                  {{ row.account ? 'Connected' : 'Not connected' }}
                </p>
              </div>
            </div>
            <UButton
              v-if="row.account"
              color="error"
              variant="ghost"
              size="sm"
              icon="i-lucide-unlink"
              label="Disconnect"
              :disabled="loading"
              @click="askUnlink(row.account.providerId, row.account.accountId)"
            />
            <UButton
              v-else
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-link"
              label="Connect"
              :disabled="loading"
              @click="() => void onLink?.(row.provider)"
            />
          </div>
        </template>

        <p v-if="!rows.length" class="text-muted text-sm">
          No providers available.
        </p>
      </div>
    </div>
  </div>
</template>
