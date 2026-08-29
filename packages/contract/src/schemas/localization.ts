import { canonicalizeLocale, LOCALIZATION_LOCALES } from '@hayasedb/domain'
import * as z from 'zod'

interface LocalizedListOptions {
  minimum?: number
  requiredMessage?: string
  exactlyOneOriginal?: boolean
  originalMessage?: string
}

export const localeSchema = z
  .string()
  .transform((value) => canonicalizeLocale(value))
  .pipe(
    z.enum(LOCALIZATION_LOCALES, {
      error: 'Unsupported localization language',
    }),
  )

export const localizedTitleSchema = z.object({
  locale: localeSchema,
  title: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((title) => title.normalize('NFC')),
  original: z.boolean().default(false),
})

export const localizedEpisodeTextSchema = localizedTitleSchema.extend({
  overview: z
    .string()
    .trim()
    .min(1)
    .max(2_000)
    .transform((overview) => overview.normalize('NFC'))
    .nullable()
    .default(null),
})

export function localizedListSchema<
  T extends z.ZodType<{ locale: string; original?: boolean }>,
>(
  entrySchema: T,
  {
    minimum = 0,
    requiredMessage,
    exactlyOneOriginal = false,
    originalMessage = 'Only one title may be original',
  }: LocalizedListOptions = {},
) {
  const base = z.array(entrySchema).max(100)
  return (minimum > 0 ? base.min(minimum, requiredMessage) : base)
    .superRefine((translations, ctx) => {
      const locales = new Set<string>()
      let originals = 0
      for (const [index, translation] of translations.entries()) {
        if (locales.has(translation.locale)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Duplicate locale',
            path: [index, 'locale'],
          })
        }
        locales.add(translation.locale)
        if (translation.original === true) originals += 1
      }
      if (exactlyOneOriginal ? originals !== 1 : originals > 1) {
        ctx.addIssue({ code: 'custom', message: originalMessage })
      }
    })
    .transform((items) =>
      [...items].sort((a, b) => a.locale.localeCompare(b.locale)),
    )
}

export const localizedTitleListSchema =
  localizedListSchema(localizedTitleSchema)

export const localizedEpisodeTextListSchema = localizedListSchema(
  localizedEpisodeTextSchema,
)

export type LocalizedTitle = z.output<typeof localizedTitleSchema>
export type LocalizedEpisodeText = z.output<typeof localizedEpisodeTextSchema>
