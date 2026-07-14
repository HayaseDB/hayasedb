import type { CreateAnimeInput } from '@hayasedb/contract'

export type AnimeFormField = keyof CreateAnimeInput

export interface AnimeFormSubmit {
  data: CreateAnimeInput
  changedFields: AnimeFormField[]
  commitMedia: (animeId: string) => Promise<void>
}

export function useAnimeActions() {
  const api = useApiClient()
  const toast = useToast()
  const router = useRouter()

  const saving = ref(false)

  async function save(
    anime: { id: string } | null,
    submit: AnimeFormSubmit,
  ): Promise<boolean> {
    saving.value = true
    try {
      if (anime) {
        await update(anime, submit)
      } else {
        await create(submit)
      }
      return true
    } catch (error) {
      toast.add({
        title: isConflictError(error)
          ? 'That slug is already taken'
          : 'Failed to save anime',
        color: 'error',
      })
      return false
    } finally {
      saving.value = false
    }
  }

  async function update(
    anime: { id: string },
    { data, changedFields, commitMedia }: AnimeFormSubmit,
  ): Promise<void> {
    const changed = new Set<string>(changedFields)
    const patch = Object.fromEntries(
      Object.entries(data).filter(([key]) => changed.has(key)),
    )
    if (Object.keys(patch).length > 0) {
      await api.anime.update({ id: anime.id, ...patch })
    }
    await commitMedia(anime.id)
    toast.add({ title: 'Saved', color: 'success' })
  }

  async function create({ data, commitMedia }: AnimeFormSubmit): Promise<void> {
    const created = await api.anime.create(data)
    await commitMedia(created.id)
    toast.add({ title: 'Anime created', color: 'success' })
    await router.push(`/anime/${created.id}`)
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await api.anime.remove({ id })
      toast.add({ title: 'Anime deleted', color: 'success' })
      return true
    } catch {
      toast.add({ title: 'Failed to delete anime', color: 'error' })
      return false
    }
  }

  return { saving, save, remove }
}
