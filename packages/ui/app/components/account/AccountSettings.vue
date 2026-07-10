<script setup lang="ts">
import type {
  AccountLinkedRow,
  AccountSessionRow,
  AccountUser,
  ChangeEmailSchema,
  ChangePasswordSchema,
  SetPasswordSchema,
  SocialProvider,
  UpdateProfileSchema,
} from '@hayasedb/contract'

const props = withDefaults(
  defineProps<{
    user?: AccountUser | null
    sessions?: AccountSessionRow[]
    accounts?: AccountLinkedRow[]
    currentToken?: string | null
    availableProviders?: SocialProvider[]
    loading?: boolean
    verified?: boolean
    resending?: boolean
    resendCooldown?: number
    onUpdateProfile?: (data: UpdateProfileSchema) => unknown | Promise<unknown>
    onUploadAvatar?: (file: File) => unknown | Promise<unknown>
    onChangeEmail?: (data: ChangeEmailSchema) => unknown | Promise<unknown>
    onChangePassword?: (
      data: ChangePasswordSchema,
    ) => unknown | Promise<unknown>
    onSetPassword?: (data: SetPasswordSchema) => unknown | Promise<unknown>
    onResend?: () => unknown
    onRevokeSession?: (token: string) => unknown
    onRevokeOtherSessions?: () => unknown
    onLinkAccount?: (provider: SocialProvider) => unknown
    onUnlinkAccount?: (payload: {
      providerId: string
      accountId: string
    }) => unknown
    onSignOut?: () => unknown
    onDeleteAccount?: () => unknown
  }>(),
  {
    user: null,
    sessions: () => [],
    accounts: () => [],
    currentToken: null,
    availableProviders: () => [],
    loading: false,
    verified: false,
    resending: false,
    resendCooldown: 0,
    onUpdateProfile: undefined,
    onUploadAvatar: undefined,
    onChangeEmail: undefined,
    onChangePassword: undefined,
    onSetPassword: undefined,
    onResend: undefined,
    onRevokeSession: undefined,
    onRevokeOtherSessions: undefined,
    onLinkAccount: undefined,
    onUnlinkAccount: undefined,
    onSignOut: undefined,
    onDeleteAccount: undefined,
  },
)

const hasPassword = computed(
  () =>
    props.accounts?.some(
      (account: AccountLinkedRow) => account.providerId === 'credential',
    ) ?? false,
)
</script>

<template>
  <div class="flex flex-col gap-10">
    <AccountOverviewCard
      :user="user"
      :resending="resending"
      :cooldown="resendCooldown"
      :on-resend="onResend"
    />

    <section class="flex flex-col gap-4">
      <div>
        <h2 class="text-highlighted text-base font-semibold">Account</h2>
        <p class="text-muted text-sm">Your profile and email address.</p>
      </div>

      <UPageCard variant="subtle">
        <fieldset :disabled="!verified" class="contents">
          <AccountProfileForm
            :user="user"
            :verified="verified"
            :on-submit="onUpdateProfile"
            :on-upload-avatar="onUploadAvatar"
          />
          <USeparator class="my-6" />
          <AccountEmailForm :user="user" :on-submit="onChangeEmail" />
        </fieldset>
      </UPageCard>
    </section>

    <section class="flex flex-col gap-4">
      <div>
        <h2 class="text-highlighted text-base font-semibold">Security</h2>
        <p class="text-muted text-sm">
          Password, active sessions, and connected accounts.
        </p>
      </div>

      <UPageCard variant="subtle">
        <fieldset :disabled="!verified" class="contents">
          <AccountPasswordForm
            :has-password="hasPassword"
            :on-submit="onChangePassword"
            :on-set-password="onSetPassword"
          />
          <USeparator class="my-6" />
          <AccountSessionsList
            :sessions="sessions"
            :current-token="currentToken"
            :loading="loading"
            :on-revoke="onRevokeSession"
            :on-revoke-others="onRevokeOtherSessions"
          />
          <USeparator class="my-6" />
          <AccountLinkedAccounts
            :accounts="accounts"
            :available-providers="availableProviders"
            :loading="loading"
            :on-link="onLinkAccount"
            :on-unlink="onUnlinkAccount"
          />
        </fieldset>
      </UPageCard>
    </section>

    <section class="flex flex-col gap-4">
      <div>
        <h2 class="text-error text-base font-semibold">Danger zone</h2>
        <p class="text-muted text-sm">
          Sign out of this session or permanently delete your account.
        </p>
      </div>

      <UPageCard variant="subtle">
        <AccountDangerZone
          :loading="loading"
          :on-sign-out="onSignOut"
          :on-delete-account="onDeleteAccount"
        />
      </UPageCard>
    </section>
  </div>
</template>
