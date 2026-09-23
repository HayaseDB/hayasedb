---
'@hayasedb/domain': patch
'@hayasedb/nuxt': patch
'@hayasedb/ui': patch
---

Add one shared field comparator and change-tracking composable, so a field is considered changed by the same rules everywhere and empty values like `null`, `''` and `[]` no longer count as edits
