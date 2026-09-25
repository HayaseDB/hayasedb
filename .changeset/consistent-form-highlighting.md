---
'@hayasedb/ui': patch
'@hayasedb/web': patch
'@hayasedb/admin': patch
'@hayasedb/api': patch
'@hayasedb/contract': patch
'@hayasedb/domain': patch
'@hayasedb/nuxt': patch
---

Rework the anime structure editor and the contribution review.

**Field highlighting**

- Highlight every edited field by the same rules, including translation fields such as the English title on the public contribution page.
- Add the per-field cues that season, episode and image edits were missing, and highlight fields in the season and episode slideovers even though they render outside the form.

**Seasons and episodes**

- Rebuild the manager around scannable summary rows that show their own change state and open a slideover for editing.
- Let an anime hold seasons and standalone episodes at once, ranked in one shared order, and reject two children sharing a position instead of rejecting mixed structures.
- Validate each slideover against its own schema so a bad runtime or number reports inline instead of failing silently on submit.
- Keep rows at a fixed height, drop the "N changed" counters in favour of the shared ring, and stop repeating the episode type in the number chip.
- Replace the empty-season placeholder and its button with an add card shaped like the rows around it, and stop opening the editor right after adding.

**Contribution review**

- Group each review around its anime instead of one card per entity, nest episodes under the season that owns them, and always show the anime's current fields as context.
- Nest an episode under a season the changeset only touches through its episodes, so the season still appears with its current fields.
- Hide the parent links of a season or episode from its diff, title each card by its entity type alone so the name stays in the fields below, and stop writing a number as "3.000".
- Give each card its entity icon and pin its header while the fields scroll, stacking the anime, season and episode headers at fixed heights so each sits flush under the one above.
- Square off the header background so the card's rounded corners cut it, with the border drawn over it, and let each page declare where headers pin: below the navbar on the public page, at the top of the panel in admin.
- Drop the footer from the contribution pages so the form is the last thing on the page.
