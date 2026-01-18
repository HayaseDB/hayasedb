<script setup lang="ts">
  import { getCoreRowModel, useVueTable } from '@tanstack/vue-table'
  import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Eye,
    LogOut,
    Monitor,
    MoreHorizontal,
    Smartphone,
    Tablet,
  } from 'lucide-vue-next'
  import type { SessionResponse as Session, PaginationMeta } from '#shared/types'
  import type { SessionSortField, SessionSortOrder } from '@/composables/useSettings'
  import { formatRelativeTime } from '@/utils/formatRelativeTime'

  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '@/components/ui/alert-dialog'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
  import { Input } from '@/components/ui/input'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import { Skeleton } from '@/components/ui/skeleton'
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'

  const props = defineProps<{
    sessions: Session[]
    isLoading?: boolean
    meta: PaginationMeta | null
    currentSort: SessionSortField
    currentOrder: SessionSortOrder
  }>()

  const search = defineModel<string>('search', { default: '' })

  const emit = defineEmits<{
    terminateSession: [sessionId: string]
    terminateAllOtherSessions: []
    'update:page': [page: number]
    'update:pageSize': [size: number]
    'update:sort': [sort: SessionSortField, order: SessionSortOrder]
  }>()

  const selectedSession = ref<Session | null>(null)
  const showDetailsDialog = ref(false)
  const showTerminateDialog = ref(false)
  const showTerminateAllDialog = ref(false)
  const sessionToTerminate = ref<Session | null>(null)

  const deviceIcons: Record<string, typeof Monitor> = {
    Desktop: Monitor,
    Mobile: Smartphone,
    Tablet: Tablet,
    Unknown: Monitor,
  }

  const table = useVueTable({
    get data() {
      return props.sessions
    },
    columns: [
      { accessorKey: 'deviceType', header: 'Device' },
      { accessorKey: 'ipAddress', header: 'IP Address' },
      { accessorKey: 'updatedAt', header: 'Last Active' },
      { id: 'actions', header: '' },
    ],
    getCoreRowModel: getCoreRowModel(),
  })

  const currentPage = computed(() => props.meta?.currentPage ?? 1)
  const totalPages = computed(() => props.meta?.totalPages ?? 1)
  const pageSize = computed(() => props.meta?.itemsPerPage ?? 5)
  const canPreviousPage = computed(() => currentPage.value > 1)
  const canNextPage = computed(() => currentPage.value < totalPages.value)
  const otherSessionsCount = computed(() => props.sessions.filter((s) => !s.isCurrent).length)

  function handlePageChange(page: number) {
    emit('update:page', page)
  }

  function handlePageSizeChange(size: unknown) {
    if (size != null) {
      emit('update:pageSize', Number(size))
    }
  }

  function handleSortChange(field: NonNullable<SessionSortField>) {
    if (props.currentSort !== field) {
      emit('update:sort', field, 'desc')
    } else if (props.currentOrder === 'desc') {
      emit('update:sort', field, 'asc')
    } else {
      emit('update:sort', null, null)
    }
  }

  function getSortIcon(field: NonNullable<SessionSortField>) {
    if (props.currentSort !== field) return ArrowUpDown
    return props.currentOrder === 'asc' ? ArrowUp : ArrowDown
  }

  function handleViewDetails(session: Session) {
    selectedSession.value = session
    showDetailsDialog.value = true
  }

  function handleTerminateClick(session: Session) {
    sessionToTerminate.value = session
    showTerminateDialog.value = true
  }

  function confirmTerminate() {
    if (sessionToTerminate.value) {
      emit('terminateSession', sessionToTerminate.value.id)
    }
    showTerminateDialog.value = false
    sessionToTerminate.value = null
  }

  function handleTerminateAllClick() {
    showTerminateAllDialog.value = true
  }

  function confirmTerminateAll() {
    emit('terminateAllOtherSessions')
    showTerminateAllDialog.value = false
  }
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Input
        v-model="search"
        placeholder="Search by browser, OS, device, or IP..."
        class="max-w-sm"
      />
      <Button
        v-if="otherSessionsCount > 0"
        variant="destructive"
        :disabled="props.isLoading"
        @click="handleTerminateAllClick"
      >
        <LogOut class="mr-2 h-4 w-4" />
        Terminate All Other Sessions
      </Button>
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                class="data-[state=open]:bg-accent -ml-3 h-8"
                @click="handleSortChange('updated_at')"
              >
                Last Active
                <component :is="getSortIcon('updated_at')" class="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                class="data-[state=open]:bg-accent -ml-3 h-8"
                @click="handleSortChange('created_at')"
              >
                Created
                <component :is="getSortIcon('created_at')" class="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="props.isLoading">
            <TableRow v-for="i in pageSize" :key="`skeleton-${i}`" class="h-16">
              <TableCell>
                <div class="flex items-center gap-3">
                  <Skeleton class="h-5 w-5 shrink-0 rounded-md" />
                  <div class="flex flex-col gap-1.5">
                    <Skeleton class="h-4 w-32 rounded-md" />
                    <Skeleton class="h-3 w-24 rounded-md" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-28 rounded-md" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-24 rounded-md" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-24 rounded-md" />
              </TableCell>
              <TableCell class="text-right">
                <Skeleton class="ml-auto h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else-if="table.getRowModel().rows.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="h-16"
              :class="{ 'bg-muted/50': row.original.isCurrent }"
            >
              <TableCell>
                <div class="flex items-center gap-3">
                  <component
                    :is="deviceIcons[row.original.deviceType]"
                    class="text-muted-foreground h-5 w-5 shrink-0"
                  />
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="truncate font-medium">
                        {{ row.original.browser ?? 'Unknown' }}
                        {{ row.original.browserVersion ?? '' }}
                      </span>
                      <Badge
                        v-if="row.original.isCurrent"
                        variant="secondary"
                        class="shrink-0 border-green-500/50 bg-green-500/10 text-green-600"
                      >
                        Current
                      </Badge>
                    </div>
                    <span class="text-muted-foreground text-sm">
                      {{ row.original.os ?? 'Unknown' }}
                      {{ row.original.osVersion ?? '' }}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell class="font-mono text-sm">
                {{ row.original.ipAddress ?? 'Unknown' }}
              </TableCell>

              <TableCell>
                {{ formatRelativeTime(row.original.updatedAt) }}
              </TableCell>

              <TableCell>
                {{ formatRelativeTime(row.original.createdAt) }}
              </TableCell>

              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <MoreHorizontal class="h-4 w-4" />
                      <span class="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="handleViewDetails(row.original)">
                      <Eye class="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    <template v-if="!row.original.isCurrent">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        class="text-destructive focus:text-destructive"
                        @click="handleTerminateClick(row.original)"
                      >
                        <LogOut class="mr-2 h-4 w-4" />
                        Terminate session
                      </DropdownMenuItem>
                    </template>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell :colspan="5" class="text-muted-foreground h-24 text-center">
              No sessions found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-between px-2">
      <div class="text-muted-foreground flex items-center gap-2 text-sm">
        <span>Rows per page:</span>
        <Select :model-value="String(pageSize)" @update:model-value="handlePageSizeChange">
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground text-sm">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <div class="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            :disabled="!canPreviousPage || props.isLoading"
            @click="handlePageChange(currentPage - 1)"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="!canNextPage || props.isLoading"
            @click="handlePageChange(currentPage + 1)"
          >
            Next
          </Button>
        </div>
      </div>
    </div>

    <Dialog v-model:open="showDetailsDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
          <DialogDescription> Detailed information about this session. </DialogDescription>
        </DialogHeader>
        <div v-if="selectedSession" class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">Device Type</span>
              <p class="font-medium">{{ selectedSession.deviceType }}</p>
            </div>
            <div>
              <span class="text-muted-foreground">Browser</span>
              <p class="font-medium">
                {{ selectedSession.browser ?? 'Unknown' }}
                {{ selectedSession.browserVersion ?? '' }}
              </p>
            </div>
            <div>
              <span class="text-muted-foreground">Operating System</span>
              <p class="font-medium">
                {{ selectedSession.os ?? 'Unknown' }}
                {{ selectedSession.osVersion ?? '' }}
              </p>
            </div>
            <div>
              <span class="text-muted-foreground">IP Address</span>
              <p class="font-mono font-medium">{{ selectedSession.ipAddress ?? 'Unknown' }}</p>
            </div>
            <div>
              <span class="text-muted-foreground">Created</span>
              <p class="font-medium">{{ formatRelativeTime(selectedSession.createdAt) }}</p>
            </div>
            <div>
              <span class="text-muted-foreground">Last Active</span>
              <p class="font-medium">{{ formatRelativeTime(selectedSession.updatedAt) }}</p>
            </div>
          </div>
          <Badge
            v-if="selectedSession.isCurrent"
            variant="secondary"
            class="border-green-500/50 bg-green-500/10 text-green-600"
          >
            This is your current session
          </Badge>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="showTerminateDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terminate Session?</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately log out the device from your account. The session from
            {{ sessionToTerminate?.browser }} on {{ sessionToTerminate?.os }} will be terminated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmTerminate"
          >
            Terminate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog v-model:open="showTerminateAllDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terminate All Other Sessions?</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately log out all other devices from your account.
            {{ otherSessionsCount }} session{{ otherSessionsCount > 1 ? 's' : '' }} will be
            terminated. Your current session will remain active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmTerminateAll"
          >
            Terminate All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
