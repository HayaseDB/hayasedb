<script setup lang="ts">
import type {
  AccountLinkedRow,
  AccountSessionRow,
  AccountUser,
  ChangeEmailSchema,
  ChangePasswordSchema,
  SocialProvider,
  UpdateProfileSchema,
} from '@hayasedb/contract'

withDefaults(
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
    pendingEmail?: string | null
    onUpdateProfile?: (data: UpdateProfileSchema) => unknown | Promise<unknown>
    onUploadAvatar?: (file: File) => unknown | Promise<unknown>
    onChangeEmail?: (data: ChangeEmailSchema) => unknown | Promise<unknown>
    onChangePassword?: (
      data: ChangePasswordSchema,
    ) => unknown | Promise<unknown>
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
    pendingEmail: null,
    onUpdateProfile: undefined,
    onUploadAvatar: undefined,
    onChangeEmail: undefined,
    onChangePassword: undefined,
  },
)

const emit = defineEmits<{
  resend: []
  'revoke-session': [token: string]
  'revoke-other-sessions': []
  'link-account': [provider: SocialProvider]
  'unlink-account': [payload: { providerId: string; accountId: string }]
}>()
</script>

<template>
  <div class="flex flex-col gap-10">
    <AccountOverviewCard
      :user="user"
      :resending="resending"
      :cooldown="resendCooldown"
      @resend="emit('resend')"
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
          <AccountEmailForm
            :user="user"
            :pending-email="pendingEmail"
            :on-submit="onChangeEmail"
          />
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
          <AccountPasswordForm :on-submit="onChangePassword" />
          <USeparator class="my-6" />
          <AccountSessionsList
            :sessions="sessions"
            :current-token="currentToken"
            :loading="loading"
            @revoke="emit('revoke-session', $event)"
            @revoke-others="emit('revoke-other-sessions')"
          />
          <USeparator class="my-6" />
          <AccountLinkedAccounts
            :accounts="accounts"
            :available-providers="availableProviders"
            :loading="loading"
            @link="emit('link-account', $event)"
            @unlink="emit('unlink-account', $event)"
          />
        </fieldset>
      </UPageCard>
    </section>
  </div>
</template>
