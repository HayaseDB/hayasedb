<script setup lang="ts">
import type { ChangeDetail } from '@hayasedb/contract'
import type { EntityKind } from '@hayasedb/domain'

const props = withDefaults(
  defineProps<{
    revisions: RevisionGraphRevision[]
    entityKind: EntityKind
    openChangesets?: RevisionGraphBranch[]
    headRev?: number
    earlierCount?: number
    busy?: boolean
    onRevert?: (id: string) => unknown | Promise<unknown>
    onLoadRevision?: (id: string) => Promise<RevisionDiffSource>
    changesetLink?: (changesetId: string) => string
    onOpenChangeset?: (changesetId: string) => unknown
  }>(),
  {
    openChangesets: () => [],
    headRev: undefined,
    earlierCount: 0,
    busy: false,
    onRevert: undefined,
    onLoadRevision: undefined,
    changesetLink: undefined,
    onOpenChangeset: undefined,
  },
)

const graph = computed(() =>
  buildRevisionGraph({
    revisions: props.revisions,
    entityKind: props.entityKind,
    openChangesets: props.openChangesets,
    headRev: props.headRev,
    hasEarlier: props.earlierCount > 0,
  }),
)

const expandedId = ref<string | null>(null)
const diffs = ref<Record<string, ChangeDetail>>({})
const loadingId = ref<string | null>(null)
const failedId = ref<string | null>(null)

const expandable = computed(() => Boolean(props.onLoadRevision))

async function toggle(id: string) {
  if (!props.onLoadRevision) return
  if (expandedId.value === id) {
    expandedId.value = null
    return
  }
  expandedId.value = id
  if (diffs.value[id]) return

  loadingId.value = id
  failedId.value = null
  try {
    const detail = await props.onLoadRevision(id)
    diffs.value = { ...diffs.value, [id]: revisionDiffChange(detail) }
  } catch {
    if (loadingId.value === id) failedId.value = id
  } finally {
    if (loadingId.value === id) loadingId.value = null
  }
}

const headViewBox = computed(
  () => `0 0 ${graph.value.gutterWidth} ${ROW_HEAD_HEIGHT}`,
)

const hoveredLane = ref<string | null>(null)

const hoverKeyFor = (row: RevisionGraphRow) =>
  row.highlightKey ?? `row:${row.id}`

const HIT_WIDTH = 14

function highlight(key: string | null) {
  hoveredLane.value = key
}

function highlightRow(row: RevisionGraphRow) {
  if (hoveredLane.value !== null) return
  hoveredLane.value = hoverKeyFor(row)
}

function releaseRow(row: RevisionGraphRow) {
  if (hoveredLane.value === hoverKeyFor(row)) hoveredLane.value = null
}

const isLit = (branchKey: string) => branchKey === hoveredLane.value

const isDimmed = (branchKey: string) =>
  hoveredLane.value !== null && branchKey !== hoveredLane.value

const isRowLit = (row: RevisionGraphRow) =>
  hoveredLane.value === hoverKeyFor(row)

const isRowDimmed = (row: RevisionGraphRow) =>
  hoveredLane.value !== null && !isRowLit(row)

const railStroke = (rail: { branchKey: string; color: RevisionGraphColor }) =>
  isLit(rail.branchKey) ? STROKE.primary : STROKE[rail.color]

const dimOpacity = (branchKey: string) =>
  isDimmed(branchKey) ? 'opacity-30' : 'opacity-100'

const railSpans = (
  rail: { kind: RevisionRailKind; laneIndex: number },
  dotLane: number,
) => {
  if (rail.laneIndex !== dotLane) return [{ y1: 0, y2: ROW_HEAD_HEIGHT }]
  if (rail.kind === 'top') return [{ y1: 0, y2: NODE_TOP }]
  if (rail.kind === 'bottom') return [{ y1: NODE_BOTTOM, y2: ROW_HEAD_HEIGHT }]
  return [
    { y1: 0, y2: NODE_TOP },
    { y1: NODE_BOTTOM, y2: ROW_HEAD_HEIGHT },
  ]
}

const STROKE: Record<RevisionGraphColor, string> = {
  success: 'stroke-(--ui-success)',
  primary: 'stroke-(--ui-primary)',
  error: 'stroke-(--ui-error)',
  warning: 'stroke-(--ui-warning)',
  neutral: 'stroke-(--ui-border-accented)',
}

const FILL: Record<RevisionGraphColor, string> = {
  success: 'fill-(--ui-success)',
  primary: 'fill-(--ui-primary)',
  error: 'fill-(--ui-error)',
  warning: 'fill-(--ui-warning)',
  neutral: 'fill-(--ui-border-accented)',
}

const TEXT_TONE: Record<RevisionGraphColor, string> = {
  success: 'text-success',
  primary: 'text-primary',
  error: 'text-error',
  warning: 'text-warning',
  neutral: 'text-muted',
}
</script>

<template>
  <div>
    <ul v-if="graph.rows.length" role="list" class="flex max-w-4xl flex-col">
      <li
        v-for="row in graph.rows"
        :key="row.id"
        class="group relative flex gap-4"
        :style="{ minHeight: `${ROW_HEAD_HEIGHT}px` }"
        @mouseenter="highlightRow(row)"
        @mouseleave="releaseRow(row)"
        @focusin="highlight(hoverKeyFor(row))"
        @focusout="highlight(null)"
      >
        <div
          class="pointer-events-none flex shrink-0 transform-gpu flex-col self-stretch [backface-visibility:hidden]"
          :style="{ width: `${graph.gutterWidth}px` }"
          aria-hidden="true"
        >
          <svg
            :width="graph.gutterWidth"
            :height="ROW_HEAD_HEIGHT"
            :viewBox="headViewBox"
            class="block shrink-0"
            focusable="false"
          >
            <template v-for="rail in row.headRails" :key="rail.key">
              <line
                v-for="(span, index) in railSpans(rail, row.laneIndex)"
                :key="`${rail.key}-${index}`"
                :x1="rail.x"
                :x2="rail.x"
                v-bind="span"
                fill="none"
                class="transition-[stroke,opacity]"
                :class="[railStroke(rail), dimOpacity(rail.branchKey)]"
                :stroke-width="RAIL_WIDTH"
                :stroke-dasharray="rail.dashed ? '4 4' : undefined"
                stroke-linecap="butt"
                shape-rendering="geometricPrecision"
              />
            </template>

            <path
              v-for="connector in row.connectors"
              :key="connector.key"
              :d="connector.path"
              fill="none"
              class="transition-[stroke,opacity]"
              :class="[railStroke(connector), dimOpacity(connector.branchKey)]"
              :stroke-width="RAIL_WIDTH"
              :stroke-dasharray="connector.dashed ? '4 4' : undefined"
              stroke-linecap="butt"
              stroke-linejoin="round"
              shape-rendering="geometricPrecision"
            />

            <template v-for="rail in row.headRails" :key="`hit-${rail.key}`">
              <line
                v-for="(span, index) in railSpans(rail, row.laneIndex)"
                :key="`hit-${rail.key}-${index}`"
                :x1="rail.x"
                :x2="rail.x"
                v-bind="span"
                fill="none"
                stroke="transparent"
                :stroke-width="HIT_WIDTH"
                class="pointer-events-auto cursor-pointer"
                @mouseenter="highlight(rail.branchKey)"
                @mouseleave="highlight(null)"
              />
            </template>
            <path
              v-for="connector in row.connectors"
              :key="`hit-${connector.key}`"
              :d="connector.path"
              fill="none"
              stroke="transparent"
              :stroke-width="HIT_WIDTH"
              class="pointer-events-auto cursor-pointer"
              @mouseenter="highlight(connector.branchKey)"
              @mouseleave="highlight(null)"
            />

            <circle
              v-if="row.dot === 'head' || isRowLit(row)"
              :cx="row.dotX"
              :cy="NODE_Y"
              :r="DOT_HALO_RADIUS"
              class="fill-(--ui-primary)"
              opacity="0.25"
            />
            <circle
              :cx="row.dotX"
              :cy="NODE_Y"
              :r="row.dot === 'hollow' ? HOLLOW_DOT_RADIUS : DOT_RADIUS"
              class="transition-opacity"
              shape-rendering="geometricPrecision"
              :class="[
                row.dot === 'hollow' ? 'fill-(--ui-bg)' : FILL[row.color],
                STROKE[row.color],
                isRowDimmed(row) ? 'opacity-30' : 'opacity-100',
              ]"
              :stroke-width="row.dot === 'hollow' ? RAIL_WIDTH : 0"
            />
          </svg>

          <svg
            v-if="row.tailRails.length"
            :width="graph.gutterWidth"
            height="100%"
            :viewBox="`0 0 ${graph.gutterWidth} 10`"
            preserveAspectRatio="none"
            class="block min-h-0 flex-1"
            focusable="false"
          >
            <line
              v-for="rail in row.tailRails"
              :key="rail.key"
              :x1="rail.x"
              :x2="rail.x"
              y1="-1"
              y2="11"
              fill="none"
              class="transition-[stroke,opacity]"
              :class="[railStroke(rail), dimOpacity(rail.branchKey)]"
              :stroke-width="RAIL_WIDTH"
              :stroke-dasharray="rail.dashed ? '4 4' : undefined"
              stroke-linecap="butt"
              vector-effect="non-scaling-stroke"
              shape-rendering="geometricPrecision"
            />
            <line
              v-for="rail in row.tailRails"
              :key="`hit-${rail.key}`"
              :x1="rail.x"
              :x2="rail.x"
              y1="-1"
              y2="11"
              fill="none"
              stroke="transparent"
              :stroke-width="HIT_WIDTH"
              vector-effect="non-scaling-stroke"
              class="pointer-events-auto cursor-pointer"
              @mouseenter="highlight(rail.branchKey)"
              @mouseleave="highlight(null)"
            />
          </svg>
        </div>

        <div
          class="group-hover:bg-elevated/40 min-w-0 flex-1 rounded-md px-3 py-2.5 transition-colors"
        >
          <div
            class="flex flex-wrap items-center gap-x-2 gap-y-1"
            :class="
              expandable && row.type === 'revision' ? 'cursor-pointer' : ''
            "
            :role="expandable && row.type === 'revision' ? 'button' : undefined"
            :tabindex="expandable && row.type === 'revision' ? 0 : undefined"
            :aria-expanded="
              expandable && row.type === 'revision'
                ? expandedId === row.id
                : undefined
            "
            @click="row.type === 'revision' && toggle(row.id)"
            @keydown.enter.prevent="row.type === 'revision' && toggle(row.id)"
            @keydown.space.prevent="row.type === 'revision' && toggle(row.id)"
          >
            <span class="sr-only">{{ row.dotLabel }}</span>

            <UIcon
              v-if="row.icon"
              :name="row.icon"
              class="size-3.5 shrink-0"
              :class="TEXT_TONE[row.color]"
              aria-hidden="true"
            />

            <span
              v-if="row.type === 'revision'"
              class="shrink-0 font-mono text-xs transition-colors"
              :class="isRowLit(row) ? 'text-primary' : 'text-dimmed'"
            >
              r{{ row.rev }}
            </span>

            <span class="text-highlighted truncate text-sm font-medium">
              {{ row.actor?.name ?? 'System' }}
            </span>
            <span class="text-muted truncate text-sm">{{ row.title }}</span>

            <UBadge
              v-if="row.type === 'revision' && row.isHead"
              label="head"
              color="primary"
              variant="subtle"
              size="sm"
            />
            <UBadge
              v-else-if="row.type === 'branch'"
              :label="CHANGESET_STATUS_LABELS[row.status]"
              :color="CHANGESET_STATUS_COLORS[row.status]"
              variant="subtle"
              size="sm"
            />

            <NuxtTime
              class="text-dimmed shrink-0 text-xs"
              :datetime="row.date"
              relative
              locale="en"
            />

            <span class="flex-1" />

            <UButton
              v-if="row.type === 'branch' && onOpenChangeset"
              label="Open"
              :aria-label="`Open contribution ${row.changesetId}`"
              icon="i-lucide-external-link"
              color="neutral"
              variant="ghost"
              size="xs"
              class="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
              @click.stop="() => void onOpenChangeset?.(row.changesetId)"
            />

            <UButton
              v-if="row.type === 'revision' && onRevert && row.canRevert"
              label="Revert to this"
              :aria-label="`Revert to revision ${row.rev}`"
              icon="i-lucide-undo-2"
              color="neutral"
              variant="ghost"
              size="xs"
              :loading="busy"
              class="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
              @click.stop="() => void onRevert?.(row.id)"
            />
          </div>

          <p v-if="row.summary" class="text-muted mt-0.5 truncate text-sm">
            {{ row.summary }}
            <ULink
              v-if="row.changesetId && changesetLink"
              :to="changesetLink(row.changesetId)"
              class="text-primary text-xs whitespace-nowrap"
              @click.stop
            >
              {{ row.type === 'branch' ? 'review' : 'changeset' }}
            </ULink>
          </p>

          <p
            v-if="row.type === 'revision' && row.fieldLabels.length"
            class="text-dimmed mt-0.5 text-xs"
          >
            {{ row.fieldLabels.join(' · ') }}
            <UTooltip
              v-if="row.hiddenFieldLabels.length"
              :text="row.hiddenFieldLabels.join(', ')"
            >
              <span class="cursor-help underline decoration-dotted">
                +{{ row.hiddenFieldLabels.length }} more
              </span>
            </UTooltip>
          </p>

          <div
            v-if="row.type === 'revision' && expandedId === row.id"
            class="mt-3 mb-2"
          >
            <USkeleton v-if="loadingId === row.id" class="h-24 w-full" />
            <p v-else-if="failedId === row.id" class="text-error text-sm">
              This revision could not be loaded.
            </p>
            <ChangeDiffTable
              v-else-if="diffs[row.id]"
              :change="diffs[row.id]!"
            />
          </div>
        </div>
      </li>
    </ul>

    <p v-else class="text-muted px-4 py-6 text-sm">No revisions yet.</p>

    <p
      v-if="earlierCount > 0"
      class="text-dimmed text-xs"
      :style="{ paddingInlineStart: `${graph.gutterWidth + 12}px` }"
    >
      {{ earlierCount }} earlier revisions not shown
    </p>
  </div>
</template>
