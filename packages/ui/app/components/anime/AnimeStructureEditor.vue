<script setup lang="ts">
import { ANIME_SEASON_FIELD_ORDER } from '@hayasedb/domain'
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

const canAddSeason = computed(() => !hasEpisodes.value)
const canAddEpisode = computed(() => !hasSeasons.value)

const expanded = ref<string[]>([])

function addSeason() {
  const draft = newSeasonDraft()
  state.value.seasons.push(draft)
  expanded.value = [...expanded.value, draft.id]
}

function addEpisode(season?: SeasonDraft) {
  const draft = newEpisodeDraft()
  if (season) season.episodes.push(draft)
  else state.value.episodes.push(draft)
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
        v-if="canAddSeason"
        type="button"
        label="Add season"
        icon="i-lucide-layers"
        color="neutral"
        variant="soft"
        size="sm"
        @click="addSeason()"
      />
      <UButton
        v-if="canAddEpisode"
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

    <UAccordion
      v-if="hasSeasons"
      v-model="expanded"
      type="multiple"
      :items="
        visibleSeasons.map((season) => ({
          value: season.id,
          season,
          class: CHANGE_RING_CLASS[seasonKind(season)],
        }))
      "
      :ui="{ trigger: 'gap-3' }"
    >
      <template #default="{ item }">
        <div
          class="flex min-w-0 flex-1 flex-col items-start text-left"
          :data-change="seasonKind(item.season)"
        >
          <span class="text-highlighted truncate text-sm font-medium">
            {{ seasonLabel(item.season) }}
          </span>
          <span class="text-muted text-xs">{{ seasonMeta(item.season) }}</span>
        </div>
      </template>

      <template #trailing="{ item }">
        <div class="flex items-center gap-1" @click.stop>
          <UButton
            type="button"
            icon="i-lucide-chevron-up"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :disabled="visibleSeasons.indexOf(item.season) === 0"
            aria-label="Move season up"
            @click="moveVisible(state.seasons, item.season, -1)"
          />
          <UButton
            type="button"
            icon="i-lucide-chevron-down"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :disabled="
              visibleSeasons.indexOf(item.season) === visibleSeasons.length - 1
            "
            aria-label="Move season down"
            @click="moveVisible(state.seasons, item.season, 1)"
          />
          <UButton
            type="button"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            square
            aria-label="Remove season"
            @click="removeSeason(item.season)"
          />
        </div>
      </template>

      <template #content="{ item }">
        <div class="flex flex-col gap-3 pb-3">
          <AnimeSeasonFields :season="item.season" />

          <div class="flex flex-col gap-2">
            <AnimeEpisodeFields
              v-for="(episode, index) in visibleSeasonEpisodes(item.season)"
              :key="episode.id"
              :episode="episode"
              :label="episodeLabel(episode)"
              :is-first="index === 0"
              :is-last="index === visibleSeasonEpisodes(item.season).length - 1"
              @move-up="moveVisible(item.season.episodes, episode, -1)"
              @move-down="moveVisible(item.season.episodes, episode, 1)"
              @remove="removeEpisode(episode, item.season)"
            />

            <p
              v-if="!visibleSeasonEpisodes(item.season).length"
              class="text-muted text-sm"
            >
              No episodes in this
              {{ ANIME_SEASON_KIND_LABELS[item.season.kind].toLowerCase() }}
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
              @click="addEpisode(item.season)"
            />
          </div>
        </div>
      </template>
    </UAccordion>

    <div v-if="hasEpisodes" class="flex flex-col gap-2">
      <AnimeEpisodeFields
        v-for="(episode, index) in visibleEpisodes"
        :key="episode.id"
        :episode="episode"
        :label="episodeLabel(episode)"
        :is-first="index === 0"
        :is-last="index === visibleEpisodes.length - 1"
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
