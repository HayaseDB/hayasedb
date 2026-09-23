<script setup lang="ts">
import {
  ANIME_EPISODE_FIELD_ORDER,
  ANIME_SEASON_FIELD_ORDER,
} from '@hayasedb/domain'
import type {
  AnimeStructureState,
  ChangeKind,
  EpisodeDraft,
  SeasonDraft,
} from '#imports'

const state = defineModel<AnimeStructureState>('state', { required: true })

withDefaults(
  defineProps<{
    loading?: boolean
    changeCount?: number
    changeBudget?: number
  }>(),
  { loading: false, changeCount: 0, changeBudget: 0 },
)

const visibleSeasons = computed(() =>
  state.value.seasons.filter((season) => !season.removed),
)
const visibleEpisodes = computed(() =>
  state.value.episodes.filter((episode) => !episode.removed),
)

const hasSeasons = computed(() => visibleSeasons.value.length > 0)
const hasEpisodes = computed(() => visibleEpisodes.value.length > 0)

const { openEpisode, openSeason } = useAnimeStructureOverlays()

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

const changedEpisodeCount = (episodes: EpisodeDraft[]) =>
  episodes.filter((episode) => {
    if (episode.removed) return false
    if (episode.isNew) return true
    const at = `episodes.${episode.id}`
    return (
      scope.kindOf(`${at}.$state`) !== 'unchanged' ||
      ANIME_EPISODE_FIELD_ORDER.some(
        (field) => scope.kindOf(`${at}.${field}`) !== 'unchanged',
      ) ||
      episode.translations.some((item) =>
        ['title', 'overview'].some(
          (field) =>
            scope.kindOf(`${at}.translations.${item.locale}.${field}`) !==
            'unchanged',
        ),
      )
    )
  }).length

const episodeChangeLabel = (count: number) =>
  `${count} ${count === 1 ? 'episode' : 'episodes'} changed`

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

    <div v-if="hasSeasons" class="flex flex-col gap-4">
      <div
        v-for="(season, seasonIndex) in visibleSeasons"
        :key="season.id"
        class="flex flex-col gap-2"
      >
        <div
          class="border-default flex min-h-12 items-center gap-2 rounded-md border p-2"
          :data-change="seasonKind(season)"
          :class="CHANGE_RING_CLASS[seasonKind(season)]"
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            @click="openSeason(season)"
          >
            <UIcon
              name="i-lucide-layers"
              class="text-dimmed size-4 shrink-0"
              aria-hidden="true"
            />
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="text-highlighted truncate text-sm font-medium">
                {{ seasonLabel(season) }}
              </span>
              <span class="text-muted text-xs">{{ seasonMeta(season) }}</span>
            </span>
          </button>

          <UBadge
            v-if="changedEpisodeCount(season.episodes) > 0"
            :label="episodeChangeLabel(changedEpisodeCount(season.episodes))"
            color="warning"
            variant="subtle"
            size="sm"
            class="hidden sm:inline-flex"
          />

          <UButton
            type="button"
            icon="i-lucide-chevron-up"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :disabled="seasonIndex === 0"
            aria-label="Move season up"
            @click="moveVisible(state.seasons, season, -1)"
          />
          <UButton
            type="button"
            icon="i-lucide-chevron-down"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :disabled="seasonIndex === visibleSeasons.length - 1"
            aria-label="Move season down"
            @click="moveVisible(state.seasons, season, 1)"
          />
          <UButton
            type="button"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            square
            aria-label="Remove season"
            @click="removeSeason(season)"
          />
        </div>

        <div class="flex flex-col gap-2 pl-4">
          <AnimeEpisodeRowEditor
            v-for="(episode, index) in visibleSeasonEpisodes(season)"
            :key="episode.id"
            :episode="episode"
            :is-first="index === 0"
            :is-last="index === visibleSeasonEpisodes(season).length - 1"
            @open="
              openEpisode(
                visibleSeasonEpisodes(season),
                index,
                seasonLabel(season),
              )
            "
            @move-up="moveVisible(season.episodes, episode, -1)"
            @move-down="moveVisible(season.episodes, episode, 1)"
            @remove="removeEpisode(episode, season)"
          />

          <p
            v-if="!visibleSeasonEpisodes(season).length"
            class="text-muted text-sm"
          >
            No episodes in this
            {{ ANIME_SEASON_KIND_LABELS[season.kind].toLowerCase() }} yet.
          </p>

          <UButton
            type="button"
            label="Add episode"
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="xs"
            class="self-start"
            @click="addEpisode(season)"
          />
        </div>
      </div>
    </div>

    <div v-if="hasEpisodes" class="flex flex-col gap-2">
      <AnimeEpisodeRowEditor
        v-for="(episode, index) in visibleEpisodes"
        :key="episode.id"
        :episode="episode"
        :is-first="index === 0"
        :is-last="index === visibleEpisodes.length - 1"
        @open="openEpisode(visibleEpisodes, index)"
        @move-up="moveVisible(state.episodes, episode, -1)"
        @move-down="moveVisible(state.episodes, episode, 1)"
        @remove="removeEpisode(episode)"
      />
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
