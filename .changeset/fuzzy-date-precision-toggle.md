---
'@hayasedb/ui': patch
'@hayasedb/admin': patch
'@hayasedb/web': patch
---

Keep the hidden parts of a fuzzy date when switching precision, so toggling from Day down to Month and back restores the day instead of discarding it, and clamp the day into range when the month or year changes rather than clearing it
