import {
  MAX_CHANGES_PER_CHANGESET,
  type AnimeDocumentMedia,
  type AnimeDocumentRelation,
  type ChangeInput,
  type CreateAnimeInput,
} from '@hayasedb/contract'
import { genreSlug } from '@hayasedb/domain'
import type { AnimeFormField, AnimeRelationInput } from '#imports'

export interface ProposedGenre {
  id: string
  name: string
}

export interface ContributionSubmit {
  data: CreateAnimeInput
  changedFields: AnimeFormField[]
  relations: AnimeRelationInput
  mediaDirty: boolean
  summary: string
  buildDocumentMedia: (
    upload: (file: File) => Promise<{ mediaId: string }>,
  ) => Promise<AnimeDocumentMedia[]>
  newGenres?: ProposedGenre[]
  supersedesId?: string
  planStructure?: (animeId: string) => ChangeInput[]
}

export function useContributionActions() {
  const api = useApiClient()
  const toast = useToast()
  const relationPlan = useAnimeRelationPlan()

  const saving = ref(false)
  const withdrawing = ref(false)

  async function submit(
    anime: { id: string; headRev: number } | null,
    input: ContributionSubmit,
  ): Promise<string | false> {
    if (input.summary.trim().length < 3) {
      toast.add({
        title: 'Please describe your change',
        description: 'A short summary helps moderators review faster.',
        color: 'warning',
      })
      return false
    }

    saving.value = true
    try {
      const media = await input.buildDocumentMedia((file) =>
        api.media.upload({ file }),
      )

      const selectedGenreIds = new Set(input.data.genreIds ?? [])
      const proposedGenres = (input.newGenres ?? []).filter((genre) =>
        selectedGenreIds.has(genre.id),
      )

      const changed = new Set<string>(input.changedFields)
      const selfId = anime?.id ?? crypto.randomUUID()
      const relationsDirty = !anime || changed.has('relationEdges')
      const relations = relationsDirty
        ? await relationPlan.plan(selfId, input.relations)
        : null

      const structureChanges = input.planStructure?.(selfId) ?? []

      let animeChange: ChangeInput | null = null
      if (anime) {
        const patch = Object.fromEntries(
          Object.entries(input.data).filter(([key]) => changed.has(key)),
        ) as Partial<CreateAnimeInput> & {
          media?: AnimeDocumentMedia[]
          relations?: AnimeDocumentRelation[]
        }
        if (input.mediaDirty) patch.media = media
        if (relations?.ownChanged) patch.relations = relations.own
        const animeUntouched =
          Object.keys(patch).length === 0 && !relations?.foreign.length
        if (animeUntouched && structureChanges.length === 0) {
          toast.add({ title: 'No changes to submit', color: 'warning' })
          return false
        }
        animeChange =
          Object.keys(patch).length === 0
            ? null
            : {
                op: 'update',
                entityKind: 'anime',
                entityId: anime.id,
                baseRev: anime.headRev,
                payload: patch,
              }
      } else {
        animeChange = {
          op: 'create',
          entityKind: 'anime',
          entityId: selfId,
          payload: {
            ...input.data,
            genreIds: input.data.genreIds ?? [],
            relations: relations?.own ?? [],
            media,
          },
        }
      }

      const relationChanges: ChangeInput[] = (relations?.foreign ?? []).map(
        (other) => ({
          op: 'update',
          entityKind: 'anime',
          entityId: other.animeId,
          baseRev: other.headRev,
          payload: { relations: other.relations },
        }),
      )

      const genreChanges: ChangeInput[] = proposedGenres.map((genre) => ({
        op: 'create',
        entityKind: 'genre',
        entityId: genre.id,
        payload: {
          slug: genreSlug(genre.name),
          translations: [{ locale: 'en', name: genre.name }],
        },
      }))

      const changes: ChangeInput[] = [
        ...genreChanges,
        ...(animeChange ? [animeChange] : []),
        ...relationChanges,
        ...structureChanges,
      ]

      if (changes.length > MAX_CHANGES_PER_CHANGESET) {
        toast.add({
          title: 'Too many changes for one contribution',
          description: `A contribution can carry ${MAX_CHANGES_PER_CHANGESET} changes; this one has ${changes.length}. Please split it up.`,
          color: 'warning',
        })
        return false
      }

      const changeset = await api.changeset.submit({
        summary: input.summary.trim(),
        changes,
        supersedesId: input.supersedesId,
      })
      toast.add({
        title: 'Contribution submitted',
        description: 'A moderator will review it soon.',
        color: 'success',
      })
      return changeset.id
    } catch (error) {
      toast.add({
        title: isConflictError(error)
          ? (orpcErrorMessage(error) ?? 'That slug is already taken')
          : 'Failed to submit contribution',
        color: 'error',
      })
      return false
    } finally {
      saving.value = false
    }
  }

  async function withdraw(id: string): Promise<boolean> {
    withdrawing.value = true
    try {
      await api.changeset.withdraw({ id })
      toast.add({ title: 'Contribution withdrawn', color: 'success' })
      return true
    } catch {
      toast.add({ title: 'Failed to withdraw contribution', color: 'error' })
      return false
    } finally {
      withdrawing.value = false
    }
  }

  async function addMessage(id: string, body: string) {
    try {
      return await api.changeset.addMessage({ id, body })
    } catch {
      toast.add({ title: 'Failed to send message', color: 'error' })
      return false
    }
  }

  return { saving, withdrawing, submit, withdraw, addMessage }
}
