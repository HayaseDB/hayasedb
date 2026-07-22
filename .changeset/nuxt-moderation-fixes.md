---
'@hayasedb/nuxt': patch
---

- Fix the open-submissions count in `useModerationQueue` not refreshing, which left the sidebar indicator stale after moderating a submission
- Update `useContributionActions` for the changeset message system (post messages, reject with a reason)
