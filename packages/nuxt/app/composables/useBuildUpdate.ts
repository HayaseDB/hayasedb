export function useBuildUpdate() {
  const outdated = useState('build-outdated', () => false)

  function markOutdated() {
    outdated.value = true
  }

  function reload() {
    try {
      sessionStorage.removeItem('nuxt:reload')
    } catch (error) {
      console.warn('[build-update] could not clear reload guard', error)
    }

    window.location.reload()
  }

  return { outdated, markOutdated, reload }
}
