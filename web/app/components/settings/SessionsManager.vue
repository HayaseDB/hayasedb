<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { ColumnDef } from '@tanstack/vue-table'
  import {
    FlexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    useVueTable,
  } from '@tanstack/vue-table'
  import { Monitor, Smartphone, Tablet, MoreHorizontal, Eye, LogOut } from 'lucide-vue-next'
  import type { Session } from '@/types/session'
  import { formatRelativeTime } from '@/utils/formatRelativeTime'

  import { Button } from '@/components/ui/button'
  import { Badge } from '@/components/ui/badge'
  import { Input } from '@/components/ui/input'
  import { Skeleton } from '@/components/ui/skeleton'
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
  } from '@/components/ui/dropdown-menu'
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
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'

  const props = defineProps<{
    sessions: Session[]
    isLoading?: boolean
  }>()

  const emit = defineEmits<{
    terminateSession: [sessionId: string]
    terminateAllOtherSessions: []
  }>()

  const globalFilter = ref('')
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

  const columns: ColumnDef<Session>[] = [
    {
      accessorKey: 'deviceType',
      header: 'Device',
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Active',
    },
    {
      id: 'actions',
      header: '',
    },
  ]

  const table = useVueTable({
    get data() {
      return props.sessions
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      get globalFilter() {
        return globalFilter.value
      },
    },
    onGlobalFilterChange: (value) => {
      globalFilter.value = String(value)
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const session = row.original
      const searchValue = String(filterValue).toLowerCase()
      return (
        (session.browser?.toLowerCase().includes(searchValue) ?? false) ||
        (session.os?.toLowerCase().includes(searchValue) ?? false) ||
        (session.ipAddress?.includes(searchValue) ?? false) ||
        session.deviceType.toLowerCase().includes(searchValue)
      )
    },
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  })

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

  const otherSessionsCount = computed(() => props.sessions.filter((s) => !s.isCurrent).length)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Input
        :model-value="globalFilter"
        placeholder="Search by device or location..."
        class="max-w-sm"
        @update:model-value="(value) => (globalFilter = String(value))"
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

    <div v-if="props.isLoading" class="space-y-3">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-12 w-full" />
    </div>

    <div v-else class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="{ 'bg-muted/50': row.original.isCurrent }"
            >
              <TableCell>
                <div class="flex items-center gap-3">
                  <component
                    :is="deviceIcons[row.original.deviceType]"
                    class="text-muted-foreground h-5 w-5"
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">
                        {{ row.original.browser ?? 'Unknown' }}
                        {{ row.original.browserVersion ?? '' }}
                      </span>
                      <Badge
                        v-if="row.original.isCurrent"
                        variant="secondary"
                        class="border-green-500/50 bg-green-500/10 text-green-600"
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
            <TableCell :colspan="4" class="text-muted-foreground h-24 text-center">
              No sessions found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-between px-2">
      <div class="text-muted-foreground flex items-center gap-2 text-sm">
        <span>Rows per page:</span>
        <Select
          :model-value="String(table.getState().pagination.pageSize)"
          @update:model-value="(value) => table.setPageSize(Number(value))"
        >
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
          Page {{ table.getState().pagination.pageIndex + 1 }} of
          {{ table.getPageCount() }}
        </span>
        <div class="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
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
