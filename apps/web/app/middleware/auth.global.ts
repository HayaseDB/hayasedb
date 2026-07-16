export default createAuthMiddleware({
  protectedPaths: ['/settings', '/contribute', '/contributions'],
})
