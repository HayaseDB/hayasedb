<script setup lang="ts">
import { ANIME_SEASON_FIELD_ORDER } from '@hayasedb/domain'
import type {
  AnimeChild,
  AnimeStructureState,
  ChangeKind,
  ChangeSet,
  EpisodeDraft,
  SeasonDraft,
} from '#imports'

const state = defineModel<AnimeStructureState>('state', { required: true })

const props = withDefaults(
  defineProps<{
    loading?: boolean
    changeCount?: number
    changeBudget?: number
    changes?: ChangeSet
  }>(),
  { loading: false, changeCount: 0, changeBudget: 0, changes: undefined },
)

const visibleSeasons = computed(() =>
  state.value.seasons.filter((season) => !season.removed),
)
const visibleEpisodes = computed(() =>
  state.value.episodes.filter((episode) => !episode.removed),
)

const hasSeasons = computed(() => visibleSeasons.value.length > 0)
const hasEpisodes = computed(() => visibleEpisodes.value.length > 0)

const visibleChildren = computed(() =>
  animeChildren(state.value).filter((child) => !childRemoved(child)),
)

function openStandalone(child: AnimeChild) {
  if (child.kind !== 'episode') return
  openEpisode(visibleEpisodes.value, visibleEpisodes.value.indexOf(child.episode))
}

function openSeasonEpisode(child: AnimeChild, index: number) {
  if (child.kind !== 'season') return
  openEpisode(
    visibleSeasonEpisodes(child.season),
    index,
    seasonLabel(child.season),
  )
}

function moveChild(child: AnimeChild, delta: number) {
  const order = visibleChildren.value
  const from = order.indexOf(child)
  const target = order[from + delta]
  if (from < 0 || !target) return

  const next = [...order]
  next.splice(from, 1)
  next.splice(order.indexOf(target), 0, child)

  next.forEach((entry, index) => {
    if (entry.kind === 'season') entry.season.position = index
    else entry.episode.position = index
  })

  let trailing = next.length
  for (const entry of animeChildren(state.value)) {
    if (!childRemoved(entry)) continue
    if (entry.kind === 'season') entry.season.position = trailing++
    else entry.episode.position = trailing++
  }

  state.value.seasons = [...state.value.seasons].sort(
    (a, b) => a.position - b.position,
  )
  state.value.episodes = [...state.value.episodes].sort(
    (a, b) => a.position - b.position,
  )
}

const { openEpisode, openSeason } = useAnimeStructureOverlays(
  () => props.changes,
)

function addSeason() {
  const draft = newSeasonDraft()
  state.value.seasons.push(draft)
  openSeason(draft)
}

function addEpisode(season?: SeasonDraft) {
  const draft = newEpisodeDraft()
  const list = season ? season.episodes : state.value.episodes
  list.push(draft)
  const visible = list.filter((episode) => !episode.removed)
  openEpisode(visible, visible.indexOf(draft), season && seasonLabel(season))
}

function removeSeason(season: SeasonDraft) {
  if (season.isNew) {
    state.value.seasons = state.value.seasons.filter((item) => item !== season)
    return
  }
  season.removed = true
}

function removeEpisode(episode: EpisodeDraft, season?: SeasonDraft) {
  const list = season ? season.episodes : state.value.episodes
  if (episode.isNew) {
    const index = list.indexOf(episode)
    if (index >= 0) list.splice(index, 1)
    return
  }
  episode.removed = true
}

function restoreSeason(season: SeasonDraft) {
  season.removed = false
}

function restoreEpisode(episode: EpisodeDraft) {
  episode.removed = false
}

function moveVisible<T extends { removed: boolean }>(
  list: T[],
  item: T,
  delta: number,
) {
  const visible = list.filter((entry) => !entry.removed)
  const from = visible.indexOf(item)
  const target = visible[from + delta]
  if (from < 0 || !target) return
  const toIndex = list.indexOf(target)
  list.splice(list.indexOf(item), 1)
  list.splice(toIndex, 0, item)
}

const visibleSeasonEpisodes = (season: SeasonDraft) =>
  season.episodes.filter((episode) => !episode.removed)

const seasonMeta = (season: SeasonDraft) => {
  const count = visibleSeasonEpisodes(season).length
  if (count === 0) return 'No episodes yet'
  return `${count} ${count === 1 ? 'episode' : 'episodes'}`
}

const removedSeasons = computed(() =>
  state.value.seasons.filter((season) => season.removed && !season.isNew),
)
const removedEpisodes = computed(() => [
  ...state.value.episodes.filter((item) => item.removed && !item.isNew),
  ...state.value.seasons.flatMap((season) =>
    season.episodes.filter((item) => item.removed && !item.isNew),
  ),
])

const scope = useChangeScope()

const seasonKind = (season: SeasonDraft): ChangeKind => {
  if (season.isNew) return 'added'
  if (season.removed) return 'removed'
  const at = `seasons.${season.id}`
  const touched =
    scope.kindOf(`${at}.$state`) !== 'unchanged' ||
    ANIME_SEASON_FIELD_ORDER.some(
      (field) => scope.kindOf(`${at}.${field}`) !== 'unchanged',
    ) ||
    season.translations.some(
      (item) =>
        scope.kindOf(`${at}.translations.${item.locale}.title`) !== 'unchanged',
    ) ||
    scope.kindOf(`${at}.translations.${TRANSLATION_SET_PATH}`) !== 'unchanged'
  return touched ? 'changed' : 'unchanged'
}

const seasonLabel = (season: SeasonDraft) => {
  const kind = ANIME_SEASON_KIND_LABELS[season.kind]
  const title = preferredStructureTitle(season.translations)
  return title || (season.number ? `${kind} ${season.number}` : kind)
}

const episodeLabel = (episode: EpisodeDraft) => {
  const marker =
    episode.type === 'REGULAR'
      ? (episode.number ?? '–')
      : `${ANIME_EPISODE_TYPE_LABELS[episode.type]}${episode.number ? ` ${episode.number}` : ''}`
  const title = preferredStructureTitle(episode.translations)
  return `${marker} · ${title || 'Untitled'}`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-end gap-2">
      <UButton
        type="button"
        label="Add season"
        icon="i-lucide-layers"
        color="neutral"
        variant="soft"
        size="sm"
        @click="addSeason()"
      />
      <UButton
        type="button"
        data-testid="add-direct-episode"
        label="Add episode"
        icon="i-lucide-plus"
        color="neutral"
        variant="soft"
        size="sm"
        @click="addEpisode()"
      />
    </div>

    <UAlert
      v-if="changeBudget > 0 && changeCount > changeBudget"
      icon="i-lucide-triangle-alert"
      color="warning"
      variant="subtle"
      title="Too many changes for one submission"
      :description="`This edit would submit ${changeCount} changes, over the limit of ${changeBudget}. Remove some before submitting.`"
    />

    <div v-if="loading" class="flex flex-col gap-2">
      <USkeleton v-for="index in 3" :key="index" class="h-12 w-full" />
    </div>

    <UAlert
      v-else-if="
        !hasSeasons &&
        !hasEpisodes &&
        removedSeasons.length === 0 &&
        removedEpisodes.length === 0
      "
      icon="i-lucide-list-video"
      color="neutral"
      variant="subtle"
      title="No episodes yet"
      description="Add seasons for a multi-cour show, or standalone episodes for a single run."
    />

    <div v-if="hasSeasons || hasEpisodes" class="flex flex-col gap-4">
      <template v-for="(child, childIndex) in visibleChildren">
        <AnimeEpisodeRowEditor
          v-if="child.kind === 'episode'"
          :key="child.episode.id"
          :episode="child.episode"
          :is-first="childIndex === 0"
          :is-last="childIndex === visibleChildren.length - 1"
          @open="openStandalone(child)"
          @move-up="moveChild(child, -1)"
          @move-down="moveChild(child, 1)"
          @remove="removeEpisode(child.episode)"
        />

        <div v-else :key="child.season.id" class="flex flex-col gap-2">
          <div
            class="border-default flex min-h-12 items-center gap-2 rounded-md border p-2"
            :data-change="seasonKind(child.season)"
            :class="CHANGE_RING_CLASS[seasonKind(child.season)]"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-3 text-left"
              @click="openSeason(child.season)"
            >
              <UIcon
                name="i-lucide-layers"
                class="text-dimmed size-4 shrink-0"
                aria-hidden="true"
              />
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="text-highlighted truncate text-sm font-medium">
                  {{ seasonLabel(child.season) }}
                </span>
                <span class="text-muted text-xs">{{
                  seasonMeta(child.season)
                }}</span>
              </span>
            </button>

            <UButton
              type="button"
              icon="i-lucide-chevron-up"
              color="neutral"
              variant="ghost"
              size="xs"
              square
              :disabled="childIndex === 0"
              aria-label="Move season up"
              @click="moveChild(child, -1)"
            />
            <UButton
              type="button"
              icon="i-lucide-chevron-down"
              color="neutral"
              variant="ghost"
              size="xs"
              square
              :disabled="childIndex === visibleChildren.length - 1"
              aria-label="Move season down"
              @click="moveChild(child, 1)"
            />
            <UButton
              type="button"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              square
              aria-label="Remove season"
              @click="removeSeason(child.season)"
            />
          </div>

          <div class="flex flex-col gap-2 pl-4">
            <AnimeEpisodeRowEditor
              v-for="(episode, index) in visibleSeasonEpisodes(child.season)"
              :key="episode.id"
              :episode="episode"
              :is-first="index === 0"
              :is-last="
                index === visibleSeasonEpisodes(child.season).length - 1
              "
              @open="openSeasonEpisode(child, index)"
              @move-up="moveVisible(child.season.episodes, episode, -1)"
              @move-down="moveVisible(child.season.episodes, episode, 1)"
              @remove="removeEpisode(episode, child.season)"
            />

            <p
              v-if="!visibleSeasonEpisodes(child.season).length"
              class="text-muted text-sm"
            >
              No episodes in this
              {{ ANIME_SEASON_KIND_LABELS[child.season.kind].toLowerCase() }}
              yet.
            </p>

            <UButton
              type="button"
              label="Add episode"
              icon="i-lucide-plus"
              color="neutral"
              variant="ghost"
              size="xs"
              class="self-start"
              @click="addEpisode(child.season)"
            />
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="removedSeasons.length || removedEpisodes.length"
      class="border-default flex flex-col gap-2 rounded-lg border border-dashed p-3"
    >
      <p class="text-muted text-xs font-medium">
        Will be deleted when you submit
      </p>
      <div
        v-for="season in removedSeasons"
        :key="season.id"
        class="flex items-center gap-2"
      >
        <span class="text-muted min-w-0 flex-1 truncate text-sm line-through">
          {{ seasonLabel(season) }}
        </span>
        <UButton
          type="button"
          label="Undo"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Restore season"
          @click="restoreSeason(season)"
        />
      </div>
      <div
        v-for="episode in removedEpisodes"
        :key="episode.id"
        class="flex items-center gap-2"
      >
        <span class="text-muted min-w-0 flex-1 truncate text-sm line-through">
          {{ episodeLabel(episode) }}
        </span>
        <UButton
          type="button"
          label="Undo"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Restore episode"
          @click="restoreEpisode(episode)"
        />
      </div>
    </div>
  </div>
</template>
