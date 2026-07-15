import type { CreateGenreInput, UpdateGenreInput } from '@hayasedb/contract'

export function useGenreActions() {
  const api = useApiClient()
  const toast = useToast()

  async function create(input: CreateGenreInput): Promise<boolean> {
    try {
      await api.genre.create(input)
      toast.add({ title: 'Genre created', color: 'success' })
      return true
    } catch (error) {
      toast.add({
        title: isConflictError(error)
          ? 'That genre already exists'
          : 'Failed to save genre',
        color: 'error',
      })
      return false
    }
  }

  async function update(input: UpdateGenreInput): Promise<boolean> {
    try {
      await api.genre.update(input)
      toast.add({ title: 'Genre updated', color: 'success' })
      return true
    } catch (error) {
      toast.add({
        title: isConflictError(error)
          ? 'That genre already exists'
          : 'Failed to save genre',
        color: 'error',
      })
      return false
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await api.genre.remove({ id })
      toast.add({ title: 'Genre deleted', color: 'success' })
      return true
    } catch {
      toast.add({
        title: 'Cannot delete a genre that is still used by anime',
        color: 'error',
      })
      return false
    }
  }

  return { create, update, remove }
}
