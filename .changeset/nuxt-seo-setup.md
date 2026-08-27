---
'@hayasedb/web': minor
'@hayasedb/domain': minor
'@hayasedb/admin': patch
---

Set up `@nuxtjs/seo` across the web app with sitemap, robots, OG images, schema.org and canonical URLs

The homepage title rendered as `HayaseDB · HayaseDB` because `app.head.title` set a real title value that every page without its own title inherited, which the title template then appended the site name to. The global title is gone and the homepage now sets its own, with the separator and site name coming from site config.

Anime pages fall back through romaji and native titles when no English title exists, instead of rendering an empty heading, and get a generated social card that composites the cover art alongside the title, format, year and genres. `/explore` stays indexable when unfiltered and returns `noindex, follow` with a canonical to the unfiltered URL once filters or a search query are applied. Error pages are excluded from the index.

`robots.txt` moves from a static file in `public/` to a generated route, and now disallows the account, auth and internal API paths. The sitemap is generated at runtime and lists every anime with its last modified date, degrading to the static routes if the API is unreachable.

The admin app is excluded from search indexes entirely.
