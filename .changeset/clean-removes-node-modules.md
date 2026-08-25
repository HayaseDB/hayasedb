---
'@hayasedb/admin': patch
'@hayasedb/web': patch
'@hayasedb/api': patch
'@hayasedb/e2e': patch
---

Make `clean` remove `node_modules` and leftover runtime artifacts, so it produces a fresh checkout rather than a half-cleaned tree

Workspace `node_modules` hold only symlinks into the root store, so removing them mid-run does not break the `turbo` binary resolved from the root.
