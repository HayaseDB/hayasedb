import { useBuildUpdate } from '../composables/useBuildUpdate'

export default defineNuxtPlugin((nuxtApp) => {
  const { outdated, markOutdated, reload } = useBuildUpdate()
  const toast = useToast()

  nuxtApp.hook('app:manifest:update', () => {
    if (outdated.value) return
    markOutdated()

    toast.add({
      title: 'Update available',
      description: 'A new version has been deployed. Reload to get the latest.',
      icon: 'i-lucide-refresh-cw',
      color: 'info',
      duration: 0,
      actions: [
        {
          label: 'Reload',
          color: 'neutral',
          variant: 'outline',
          onClick: () => reload(),
        },
      ],
    })
  })
})
