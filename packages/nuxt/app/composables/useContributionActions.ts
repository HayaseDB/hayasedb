import type {
  AnimeDocumentMedia,
  ChangeInput,
  CreateAnimeInput,
} from '@hayasedb/contract'

type AnimeFormField = keyof CreateAnimeInput

export interface ContributionSubmit {
  data: CreateAnimeInput
  changedFields: AnimeFormField[]
  mediaDirty: boolean
  summary: string
  buildDocumentMedia: (
    upload: (file: File) => Promise<{ mediaId: string }>,
  ) => Promise<AnimeDocumentMedia[]>
  supersedesId?: string
}

export function useContributionActions() {
  const api = useApiClient()
  const toast = useToast()

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

      let change: ChangeInput
      if (anime) {
        const changed = new Set<string>(input.changedFields)
        const patch = Object.fromEntries(
          Object.entries(input.data).filter(([key]) => changed.has(key)),
        ) as Partial<CreateAnimeInput> & { media?: AnimeDocumentMedia[] }
        if (input.mediaDirty) patch.media = media
        if (Object.keys(patch).length === 0) {
          toast.add({ title: 'No changes to submit', color: 'warning' })
          return false
        }
        change = {
          op: 'update',
          entityKind: 'anime',
          entityId: anime.id,
          baseRev: anime.headRev,
          payload: patch,
        }
      } else {
        change = {
          op: 'create',
          entityKind: 'anime',
          entityId: crypto.randomUUID(),
          payload: {
            ...input.data,
            genreIds: input.data.genreIds ?? [],
            media,
          },
        }
      }

      const changeset = await api.changeset.submit({
        summary: input.summary.trim(),
        changes: [change],
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
