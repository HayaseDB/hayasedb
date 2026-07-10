<script setup lang="ts">
import type {
  ChangeEmailSchema,
  ChangePasswordSchema,
  SetPasswordSchema,
  SocialProvider,
  UpdateProfileSchema,
} from '@hayasedb/contract'

useAuthError()

const { data: session, refresh: refreshSession } = await useAppSession()
const user = computed(() => session.value?.user ?? null)
const currentToken = computed(() => session.value?.session?.token ?? null)

const auth = useAuth()

const { data: sessions, refresh: refreshSessions } = await useAsyncData(
  'account-sessions',
  async () => {
    if (!user.value) return []
    try {
      return (await auth.listSessions()).data ?? []
    } catch {
      return []
    }
  },
  { watch: [user] },
)
const { data: accounts, refresh: refreshAccounts } = await useAsyncData(
  'account-accounts',
  async () => {
    if (!user.value) return []
    try {
      return (await auth.listAccounts()).data ?? []
    } catch {
      return []
    }
  },
  { watch: [user] },
)

const {
  loading,
  updateProfile,
  uploadAvatar,
  changeEmail,
  changePassword,
  setPassword,
  resendVerification,
  revokeSession,
  revokeOtherSessions,
  linkSocial,
  unlinkAccount,
  signOut,
  deleteAccount,
} = useAccountActions()

const verified = computed(() => Boolean(user.value?.emailVerified))

const resending = ref(false)
const resendCooldown = useResendCooldown()

async function onResend() {
  if (!user.value || resendCooldown.active.value || resending.value) return
  resending.value = true
  try {
    if (await resendVerification(user.value.email)) resendCooldown.start()
  } finally {
    resending.value = false
  }
}

async function onDeleteAccount() {
  await deleteAccount()
}

async function onUpdateProfile(data: UpdateProfileSchema) {
  const ok = await updateProfile(data)
  if (ok) await refreshSession()
  return ok
}

async function onUploadAvatar(file: File) {
  const ok = await uploadAvatar(file)
  if (ok) await refreshSession()
  return ok
}

async function onChangeEmail(data: ChangeEmailSchema) {
  const ok = await changeEmail(data)
  return ok
}

async function onChangePassword(data: ChangePasswordSchema) {
  const ok = await changePassword(data)
  if (ok) await refreshSessions()
  return ok
}

async function onSetPassword(data: SetPasswordSchema) {
  const ok = await setPassword(data)
  if (ok) await refreshAccounts()
  return ok
}

async function onRevokeSession(token: string) {
  if (await revokeSession(token)) await refreshSessions()
}

async function onRevokeOtherSessions() {
  if (await revokeOtherSessions()) await refreshSessions()
}

function onLinkAccount(provider: SocialProvider) {
  void linkSocial(provider)
}

async function onUnlinkAccount(payload: {
  providerId: string
  accountId: string
}) {
  if (await unlinkAccount(payload.providerId, payload.accountId)) {
    await refreshAccounts()
  }
}
</script>

<template>
  <UContainer class="py-10">
    <div class="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 class="text-highlighted text-2xl font-semibold">Settings</h1>
        <p class="text-muted mt-1 text-sm">
          Manage your account and security preferences.
        </p>
      </div>

      <AccountSettings
        :user="user"
        :sessions="sessions ?? []"
        :accounts="accounts ?? []"
        :current-token="currentToken"
        :available-providers="['github', 'discord']"
        :loading="loading"
        :verified="verified"
        :resending="resending"
        :resend-cooldown="resendCooldown.remaining.value"
        :on-update-profile="onUpdateProfile"
        :on-upload-avatar="onUploadAvatar"
        :on-change-email="onChangeEmail"
        :on-change-password="onChangePassword"
        :on-set-password="onSetPassword"
        :on-resend="onResend"
        :on-revoke-session="onRevokeSession"
        :on-revoke-other-sessions="onRevokeOtherSessions"
        :on-link-account="onLinkAccount"
        :on-unlink-account="onUnlinkAccount"
        :on-sign-out="signOut"
        :on-delete-account="onDeleteAccount"
      />
    </div>
  </UContainer>
</template>
