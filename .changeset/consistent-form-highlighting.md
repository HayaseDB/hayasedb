---
'@hayasedb/ui': patch
'@hayasedb/web': patch
'@hayasedb/admin': patch
---

Highlight every edited field consistently in the anime forms, fixing translation fields such as the English title never highlighting on the public contribution page, and add the per-field cues that season, episode and image edits were missing. Rebuild the seasons and episodes manager around scannable summary rows that show their own change state and open a slideover for editing, and allow an anime to hold seasons and standalone episodes at the same time, which the database always permitted but the interface blocked
