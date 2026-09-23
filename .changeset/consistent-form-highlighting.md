---
'@hayasedb/ui': patch
'@hayasedb/web': patch
'@hayasedb/admin': patch
'@hayasedb/api': patch
'@hayasedb/nuxt': patch
---

Highlight every edited field consistently in the anime forms, fixing translation fields such as the English title never highlighting on the public contribution page, and add the per-field cues that season, episode and image edits were missing. Rebuild the seasons and episodes manager around scannable summary rows that show their own change state and open a slideover for editing, and make the season and episode slideovers highlight changed fields like every other form field even though they render outside the form. Let an anime hold seasons and standalone episodes at the same time, ranking them in one shared order per anime so a standalone episode can sit between two seasons, and replace the rule that rejected mixed structures with one that rejects two children sharing a position
