export default createAuthMiddleware({
  protectedPaths: ['/settings', '/contribute', '/contributions', '/api-keys'],
})
