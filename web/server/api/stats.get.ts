export default defineEventHandler(async (): Promise<StatsResponse> => {
  // TODO: Replace with actual API call when backend endpoint is available
  return {
    totalUsers: 150,
    totalAnimes: 500,
    totalMedia: 1200,
    totalRequests: 50000,
  }
})
