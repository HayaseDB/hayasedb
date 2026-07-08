export function useAppSession() {
  return useAuth().useSession(useFetch)
}
