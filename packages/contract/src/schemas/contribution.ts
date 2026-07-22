import {
  CHANGE_OPS,
  CHANGESET_STATUSES,
  ENTITY_KINDS,
  MESSAGE_KINDS,
  type ChangeOp,
  type ChangesetStatus,
  type EntityKind,
  type MessageKind,
} from '@hayasedb/domain'
import * as z from 'zod'
import { ENTITY_DOCUMENT_SCHEMAS } from './entity-documents'
import { idSchema, paginationInputSchema } from './common'
import { mediaFileSchema } from './media'

export const entityKindSchema = z.enum(ENTITY_KINDS)
export const changesetStatusSchema = z.enum(CHANGESET_STATUSES)
export const changeOpSchema = z.enum(CHANGE_OPS)
export const changesetMessageKindSchema = z.enum(MESSAGE_KINDS)

export type { ChangeOp, ChangesetStatus, EntityKind, MessageKind }

function changeArmsForKind<K extends EntityKind>(kind: K) {
  const document = ENTITY_DOCUMENT_SCHEMAS[kind]
  const target = { entityKind: z.literal(kind), entityId: idSchema }

  const patchDocument = (document as z.ZodObject)
    .partial()
    .refine(
      (patch: Record<string, unknown>) => Object.keys(patch).length > 0,
      'Update payload must change at least one field',
    )

  return [
    z.object({
      op: z.literal('create'),
      ...target,
      payload: document,
    }),
    z.object({
      op: z.literal('update'),
      ...target,
      baseRev: z.number().int().min(1),
      payload: patchDocument,
    }),
    z.object({
      op: z.literal('delete'),
      ...target,
      baseRev: z.number().int().min(1),
    }),
  ] as const
}

const changeUnionsByKind = ENTITY_KINDS.map((kind) =>
  z.discriminatedUnion('op', changeArmsForKind(kind)),
)

export const changeInputSchema = z.discriminatedUnion(
  'entityKind',
  changeUnionsByKind as [
    (typeof changeUnionsByKind)[number],
    ...(typeof changeUnionsByKind)[number][],
  ],
)

export const changesetSummarySchema = z
  .string()
  .trim()
  .min(3, 'Describe your change')
  .max(500, 'Summary is too long')

export const submitChangesetInputSchema = z.object({
  summary: changesetSummarySchema,
  changes: z.array(changeInputSchema).min(1).max(20),
  supersedesId: idSchema.optional(),
})

export const changesetMessageBodySchema = z
  .string()
  .trim()
  .min(1, 'Message is required')
  .max(2000, 'Message is too long')

export const listChangesetsInputSchema = paginationInputSchema.extend({
  status: changesetStatusSchema.optional(),
  authorId: z.string().optional(),
  mine: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((value) => value === true || value === 'true')
    .optional(),
})

export const changesetAuthorSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
  image: z.string().nullable(),
})

export const changesetListItemSchema = z.object({
  id: idSchema,
  status: changesetStatusSchema,
  summary: z.string(),
  author: changesetAuthorSchema,
  changeCount: z.number().int(),
  entityKinds: z.array(entityKindSchema),
  submittedAt: z.date().nullable(),
  decidedAt: z.date().nullable(),
  createdAt: z.date(),
})

export const changeDetailSchema = z.object({
  id: idSchema,
  ord: z.number().int(),
  entityKind: entityKindSchema,
  entityId: idSchema,
  op: changeOpSchema,
  baseRev: z.number().int().nullable(),
  payload: z.record(z.string(), z.unknown()),
  oldValues: z.record(z.string(), z.unknown()).nullable(),
  currentValues: z.record(z.string(), z.unknown()).nullable(),
  headRev: z.number().int().nullable(),
  conflicted: z.boolean(),
  appliedRevisionId: idSchema.nullable(),
})

export const changesetMessageSchema = z.object({
  id: idSchema,
  author: changesetAuthorSchema,
  kind: changesetMessageKindSchema,
  body: z.string(),
  createdAt: z.date(),
})

export const contributionDisplaySchema = z.object({
  refs: z.record(z.string(), z.record(z.string(), z.string())),
  mediaAssets: z.record(
    z.string(),
    z.object({
      url: z.string(),
      blurhash: z.string().nullable(),
      width: z.number().int().nullable(),
      height: z.number().int().nullable(),
    }),
  ),
})

export const changesetRevertedBySchema = z.object({
  changesetId: idSchema,
  actor: changesetAuthorSchema,
  at: z.date(),
})

export const changesetDetailSchema = changesetListItemSchema.extend({
  decidedBy: changesetAuthorSchema.nullable(),
  supersedesId: idSchema.nullable(),
  supersededById: idSchema.nullable(),
  revertsId: idSchema.nullable(),
  revertedBy: changesetRevertedBySchema.nullable(),
  changes: z.array(changeDetailSchema),
  messages: z.array(changesetMessageSchema),
  display: contributionDisplaySchema,
})

export const uploadMediaInputSchema = z.object({
  file: mediaFileSchema,
})

export const uploadMediaOutputSchema = z.object({
  mediaId: idSchema,
  url: z.string(),
  blurhash: z.string().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
})

export const changesetStatsSchema = z.object({
  pending: z.number().int(),
})

export const listRevisionsInputSchema = paginationInputSchema.extend({
  entityKind: entityKindSchema,
  entityId: idSchema,
})

export const revisionListItemSchema = z.object({
  id: idSchema,
  rev: z.number().int(),
  op: changeOpSchema,
  changedFields: z.array(z.string()),
  editor: changesetAuthorSchema.nullable(),
  changesetId: idSchema.nullable(),
  changesetSummary: z.string().nullable(),
  createdAt: z.date(),
})

export const revisionDetailSchema = revisionListItemSchema.extend({
  entityId: idSchema,
  entityKind: entityKindSchema,
  snapshot: z.record(z.string(), z.unknown()),
  previousSnapshot: z.record(z.string(), z.unknown()).nullable(),
  display: contributionDisplaySchema,
})

export type ChangeInput = z.output<typeof changeInputSchema>
export type SubmitChangesetInput = z.output<typeof submitChangesetInputSchema>
export type ListChangesetsInput = z.output<typeof listChangesetsInputSchema>
export type ChangesetAuthor = z.output<typeof changesetAuthorSchema>
export type ChangesetListItem = z.output<typeof changesetListItemSchema>
export type ChangeDetail = z.output<typeof changeDetailSchema>
export type ChangesetMessage = z.output<typeof changesetMessageSchema>
export type ChangesetRevertedBy = z.output<typeof changesetRevertedBySchema>
export type ChangesetDetail = z.output<typeof changesetDetailSchema>
export type ChangesetStats = z.output<typeof changesetStatsSchema>
export type ContributionDisplay = z.output<typeof contributionDisplaySchema>
export type UploadMediaOutput = z.output<typeof uploadMediaOutputSchema>
export type RevisionListItem = z.output<typeof revisionListItemSchema>
export type RevisionDetail = z.output<typeof revisionDetailSchema>
