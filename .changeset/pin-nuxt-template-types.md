---
'@hayasedb/nuxt': patch
'@hayasedb/ui': patch
'@hayasedb/admin': patch
'@hayasedb/web': patch
---

Pin nuxt to 4.5.1: 4.5.2 regressed template-scope typing so auto-imported utils used only inside a template failed vue-tsc with TS2339
