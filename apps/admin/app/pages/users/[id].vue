<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { BreadcrumbItem, FormSubmitEvent } from '@nuxt/ui'
import { LazyConfirmModal, LazyUserBanModal } from '#components'
import {
  adminSetPasswordSchema,
  adminUpdateUserSchema,
  type AdminSetPasswordSchema,
  type AdminUpdateUserSchema,
  type UserRole,
} from '@hayasedb/contract'

const route = useRoute()
const auth = useAuth()
const id = computed(() => String(route.params.id))

const {
  data: user,
  error,
  refresh,
} = await useAsyncData(
  () => `admin-user-${id.value}`,
  async () => {
    const { data, error: getError } = await auth.admin.getUser({
      query: { id: id.value },
    })
    if (getError || !data) return null
    return data
  },
  { watch: [id] },
)

if (error.value || !user.value) {
  throw createError({ statusCode: 404, statusMessage: 'User not found' })
}

useSeoMeta({ title: () => user.value?.name ?? 'User' })

const crumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'Users', to: '/users' },
  { label: user.value?.name ?? '' },
])

const actions = useAdminUserActions()
const actionLoading = actions.loading

const { data: session } = await useAppSession()
const isSelf = computed(() => session.value?.user.id === id.value)

const { data: sessionsData, refresh: refreshSessions } = await useAsyncData(
  () => `admin-user-sessions-${id.value}`,
  async () => {
    const { data } = await auth.admin.listUserSessions({
      userId: id.value,
    })
    return data?.sessions ?? []
  },
  { watch: [id] },
)
const sessions = computed(() => sessionsData.value ?? [])

const { copy: copyId, copied: idCopied } = useClipboard()
const shortId = computed(() =>
  user.value ? `${user.value.id.slice(0, 8)}…` : '',
)

const profileState = reactive<Partial<AdminUpdateUserSchema>>({
  name: user.value?.name,
  email: user.value?.email,
})
watch(user, (value) => {
  profileState.name = value?.name
  profileState.email = value?.email
})

async function submitProfile(event: FormSubmitEvent<AdminUpdateUserSchema>) {
  if (await actions.updateUser(id.value, event.data)) await refresh()
}

const role = ref<UserRole>((user.value?.role as UserRole) ?? 'user')
watch(user, (value) => {
  role.value = (value?.role as UserRole) ?? 'user'
})
const roleDirty = computed(
  () => role.value !== ((user.value?.role as UserRole) ?? 'user'),
)

const overlay = useOverlay()
const banModal = overlay.create(LazyUserBanModal)
const confirmModal = overlay.create(LazyConfirmModal)

async function saveRole() {
  if (!roleDirty.value) return
  if (user.value?.role === 'admin' && role.value !== 'admin') {
    confirmModal.open({
      title: 'Remove admin access?',
      description: `${user.value.name} will lose access to this dashboard immediately.`,
      confirmLabel: 'Remove access',
      onConfirm: applyRole,
    })
    return
  }
  await applyRole()
}

async function applyRole(): Promise<boolean> {
  const ok = await actions.setRole(id.value, role.value)
  if (ok) await refresh()
  return ok
}

const passwordState = reactive<Partial<AdminSetPasswordSchema>>({
  newPassword: undefined,
  confirmPassword: undefined,
})

async function submitPassword(event: FormSubmitEvent<AdminSetPasswordSchema>) {
  if (await actions.setPassword(id.value, event.data.newPassword)) {
    passwordState.newPassword = undefined
    passwordState.confirmPassword = undefined
  }
}

async function revokeSession(token: string) {
  if (await actions.revokeSession(token)) await refreshSessions()
}

async function revokeAllSessions() {
  if (await actions.revokeAllSessions(id.value)) await refreshSessions()
}

function askBan() {
  banModal.open({
    userName: user.value?.name,
    onSubmit: async (data) => {
      const ok = await actions.banUser(id.value, data)
      if (ok) await Promise.all([refresh(), refreshSessions()])
      return ok
    },
  })
}

function askUnban() {
  confirmModal.open({
    title: 'Unban this user?',
    description: `${user.value?.name ?? 'This user'} will be able to sign in again.`,
    confirmLabel: 'Unban',
    confirmColor: 'primary',
    onConfirm: async () => {
      const ok = await actions.unbanUser(id.value)
      if (ok) await refresh()
      return ok
    },
  })
}

function askDeleteUser() {
  confirmModal.open({
    title: 'Delete user',
    description: `Permanently delete “${user.value?.email ?? ''}” and all associated data? This cannot be undone.`,
    confirmLabel: 'Delete',
    onConfirm: async () => {
      const ok = await actions.removeUser(id.value)
      if (ok) await navigateTo('/users')
      return ok
    },
  })
}
</script>

<template>
  <UDashboardPanel id="admin-user-detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <UBreadcrumb :items="crumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="user" class="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4">
            <UAvatar
              :src="user.image ?? undefined"
              :alt="user.name"
              size="3xl"
              class="size-16 text-xl"
            />
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h1 class="text-highlighted truncate text-lg font-semibold">
                  {{ user.name }}
                </h1>
                <UBadge
                  v-if="isSelf"
                  label="You"
                  color="primary"
                  variant="subtle"
                  size="sm"
                />
                <UBadge
                  :label="user.role === 'admin' ? 'Admin' : 'User'"
                  :color="user.role === 'admin' ? 'primary' : 'neutral'"
                  variant="subtle"
                  size="sm"
                />
                <UBadge
                  v-if="user.banned"
                  label="Banned"
                  color="error"
                  variant="subtle"
                  size="sm"
                />
                <UBadge
                  v-else-if="!user.emailVerified"
                  label="Unverified"
                  color="warning"
                  variant="subtle"
                  size="sm"
                />
              </div>
              <p class="text-muted truncate text-sm">{{ user.email }}</p>
              <p class="text-muted mt-1 text-xs">
                Joined
                <NuxtTime :datetime="user.createdAt" date-style="medium" />
              </p>
            </div>
          </div>

          <UTooltip text="Copy user ID">
            <UButton
              :label="shortId"
              :icon="idCopied ? 'i-lucide-check' : 'i-lucide-copy'"
              color="neutral"
              variant="outline"
              size="sm"
              class="shrink-0 font-mono"
              @click="copyId(user.id)"
            />
          </UTooltip>
        </div>

        <section class="flex flex-col gap-4">
          <div>
            <h2 class="text-highlighted text-base font-semibold">Account</h2>
            <p class="text-muted text-sm">Profile details and access level.</p>
          </div>

          <UPageCard variant="subtle">
            <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
              <div class="lg:col-span-1">
                <h3 class="text-highlighted text-sm font-medium">Profile</h3>
                <p class="text-muted mt-1 text-sm">
                  Update the user's name and email address.
                </p>
              </div>

              <UForm
                v-slot="{ loading }"
                :schema="adminUpdateUserSchema"
                :state="profileState"
                :validate-on="['input', 'change']"
                class="flex flex-col gap-4 lg:col-span-2"
                @submit="submitProfile"
              >
                <UFormField name="name" label="Name" required>
                  <UInput
                    v-model="profileState.name"
                    placeholder="Name"
                    class="w-full"
                  />
                </UFormField>

                <UFormField name="email" label="Email" required>
                  <UInput
                    v-model="profileState.email"
                    type="email"
                    placeholder="Email"
                    class="w-full"
                  />
                </UFormField>

                <div class="flex justify-end">
                  <UButton
                    type="submit"
                    label="Save"
                    color="primary"
                    :loading="loading"
                  />
                </div>
              </UForm>
            </div>

            <USeparator class="my-6" />

            <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
              <div class="lg:col-span-1">
                <h3 class="text-highlighted text-sm font-medium">Role</h3>
                <p class="text-muted mt-1 text-sm">
                  Administrators have full access to this dashboard.
                </p>
              </div>

              <div class="flex items-start gap-2 lg:col-span-2 lg:justify-end">
                <USelect
                  v-model="role"
                  :items="userRoleOptions"
                  value-key="value"
                  :disabled="isSelf || actionLoading"
                  class="w-40"
                />
                <UButton
                  label="Save"
                  color="primary"
                  :disabled="isSelf || !roleDirty"
                  :loading="actionLoading"
                  @click="saveRole"
                />
              </div>
              <p v-if="isSelf" class="text-muted text-xs lg:col-span-3">
                You cannot change your own role.
              </p>
            </div>
          </UPageCard>
        </section>

        <section class="flex flex-col gap-4">
          <div>
            <h2 class="text-highlighted text-base font-semibold">Security</h2>
            <p class="text-muted text-sm">Password and active sessions.</p>
          </div>

          <UPageCard variant="subtle">
            <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
              <div class="lg:col-span-1">
                <h3 class="text-highlighted text-sm font-medium">
                  Set password
                </h3>
                <p class="text-muted mt-1 text-sm">
                  Set a new password for this user. They are not notified.
                </p>
              </div>

              <UForm
                v-slot="{ loading }"
                :schema="adminSetPasswordSchema"
                :state="passwordState"
                :validate-on="['input', 'change']"
                class="flex flex-col gap-4 lg:col-span-2"
                @submit="submitPassword"
              >
                <UFormField name="newPassword" label="New password" required>
                  <UInput
                    v-model="passwordState.newPassword"
                    type="password"
                    placeholder="Enter a new password"
                    autocomplete="new-password"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  name="confirmPassword"
                  label="Confirm password"
                  required
                >
                  <UInput
                    v-model="passwordState.confirmPassword"
                    type="password"
                    placeholder="Re-enter the new password"
                    autocomplete="new-password"
                    class="w-full"
                  />
                </UFormField>

                <div class="flex justify-end">
                  <UButton
                    type="submit"
                    label="Set password"
                    color="primary"
                    :loading="loading"
                  />
                </div>
              </UForm>
            </div>

            <USeparator class="my-6" />

            <UserSessionsCard
              :sessions="sessions"
              :loading="actionLoading"
              :on-revoke="revokeSession"
              :on-revoke-all="revokeAllSessions"
            />
          </UPageCard>
        </section>

        <section class="flex flex-col gap-4">
          <div>
            <h2 class="text-error text-base font-semibold">Danger zone</h2>
            <p class="text-muted text-sm">
              Ban or permanently delete this user.
            </p>
          </div>

          <UPageCard variant="subtle">
            <div class="flex flex-col gap-6">
              <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
                <div class="lg:col-span-1">
                  <h3 class="text-highlighted text-sm font-medium">
                    {{ user.banned ? 'Unban' : 'Ban' }}
                  </h3>
                  <p v-if="user.banned" class="text-muted mt-1 text-sm">
                    Banned<template v-if="user.banReason">
                      for “{{ user.banReason }}”</template
                    ><template v-if="user.banExpires">
                      until
                      <NuxtTime
                        :datetime="user.banExpires"
                        date-style="medium"
                        time-style="short" /></template
                    ><template v-else> permanently</template>.
                  </p>
                  <p v-else class="text-muted mt-1 text-sm">
                    Blocks sign-in and revokes all active sessions.
                  </p>
                </div>

                <div class="flex items-start lg:col-span-2 lg:justify-end">
                  <UButton
                    v-if="user.banned"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-shield-check"
                    label="Unban user"
                    :disabled="actionLoading"
                    @click="askUnban"
                  />
                  <UButton
                    v-else
                    color="error"
                    variant="subtle"
                    icon="i-lucide-shield-ban"
                    label="Ban user"
                    :disabled="isSelf || actionLoading"
                    @click="askBan"
                  />
                </div>
              </div>

              <USeparator />

              <div class="grid gap-x-12 gap-y-4 lg:grid-cols-3">
                <div class="lg:col-span-1">
                  <h3 class="text-highlighted text-sm font-medium">
                    Delete user
                  </h3>
                  <p class="text-muted mt-1 text-sm">
                    Permanently delete this account and all associated data.
                    This cannot be undone.
                  </p>
                </div>

                <div class="flex items-start lg:col-span-2 lg:justify-end">
                  <UButton
                    color="error"
                    icon="i-lucide-trash-2"
                    label="Delete user"
                    :disabled="isSelf || actionLoading"
                    @click="askDeleteUser"
                  />
                </div>
              </div>

              <p v-if="isSelf" class="text-muted text-xs">
                Manage your own account from the web app settings instead.
              </p>
            </div>
          </UPageCard>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
