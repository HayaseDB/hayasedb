---
'@hayasedb/admin': patch
'@hayasedb/web': patch
'@hayasedb/ui': patch
'@hayasedb/nuxt': patch
---

Make the admin and web interfaces usable on mobile viewports

- Filters: search, selects and actions align on one baseline and break to a two-column grid below `lg`, where five controls cannot share a row. Every list shows its result count with a `Reset filters` action that appears only while filters are active, and empty states distinguish "no matches" from "no data" through `UEmpty`
- Tables: replace fixed column widths with `min-w-*` and swap `table-fixed` for `min-w-full`, so columns keep their legible width and the table scrolls inside its own container instead of compressing
- Anime form: the tab list switches to `horizontal` below `lg` through the native `UTabs` `orientation` prop, keeping Reka's indicator, `aria-orientation` and arrow-key axis correct on both layouts
- Layouts: stack row-based lists, cards and form footers below `sm`, and raise `xs` buttons to `sm` for touch targets
- Replace hover-only affordances with tappable ones: the drift popover becomes a focusable `UButton` on click, and tooltip-only timestamps move inline
- Add `viewport-fit=cover` with `env(safe-area-inset-*)` padding on `body` so content clears notches and home indicators
