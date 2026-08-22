export const ANIME_RELATION_KINDS = [
  'SEQUEL',
  'SIDE_STORY',
  'SPIN_OFF',
  'SUMMARY',
  'ALTERNATIVE',
  'CHARACTER',
  'OTHER',
] as const

export type AnimeRelationKind = (typeof ANIME_RELATION_KINDS)[number]

export const SYMMETRIC_RELATION_KINDS = [
  'ALTERNATIVE',
  'CHARACTER',
  'OTHER',
] as const satisfies ReadonlyArray<AnimeRelationKind>

export const ANIME_RELATION_INVERSE = {
  SEQUEL: 'PREQUEL',
  SIDE_STORY: 'PARENT_STORY',
  SPIN_OFF: 'SPIN_OFF_ORIGIN',
  SUMMARY: 'FULL_STORY',
  ALTERNATIVE: 'ALTERNATIVE',
  CHARACTER: 'CHARACTER',
  OTHER: 'OTHER',
} as const satisfies Record<AnimeRelationKind, string>

export const ANIME_RELATION_VIEW_KINDS = [
  'PREQUEL',
  'SEQUEL',
  'PARENT_STORY',
  'SIDE_STORY',
  'SPIN_OFF_ORIGIN',
  'SPIN_OFF',
  'FULL_STORY',
  'SUMMARY',
  'ALTERNATIVE',
  'CHARACTER',
  'OTHER',
] as const

export type AnimeRelationViewKind = (typeof ANIME_RELATION_VIEW_KINDS)[number]

export interface AnimeRelationEdge {
  readonly sourceId: string
  readonly targetId: string
  readonly kind: AnimeRelationKind
}

export function isSymmetricRelation(kind: AnimeRelationKind): boolean {
  return (SYMMETRIC_RELATION_KINDS as ReadonlyArray<string>).includes(kind)
}

export function relationViewKind(
  kind: AnimeRelationKind,
  viewerIsSource: boolean,
): AnimeRelationViewKind {
  return viewerIsSource ? kind : ANIME_RELATION_INVERSE[kind]
}

export function canonicalizeRelation(
  selfId: string,
  otherId: string,
  view: AnimeRelationViewKind,
): AnimeRelationEdge {
  if (selfId === otherId) {
    throw new Error('An anime cannot relate to itself')
  }
  const direct = (ANIME_RELATION_KINDS as ReadonlyArray<string>).includes(view)
  const kind = direct
    ? (view as AnimeRelationKind)
    : (Object.entries(ANIME_RELATION_INVERSE).find(
        ([, inverse]) => inverse === view,
      )![0] as AnimeRelationKind)

  if (isSymmetricRelation(kind)) {
    const [sourceId, targetId] =
      selfId < otherId ? [selfId, otherId] : [otherId, selfId]
    return { sourceId, targetId, kind }
  }
  return direct
    ? { sourceId: selfId, targetId: otherId, kind }
    : { sourceId: otherId, targetId: selfId, kind }
}

export interface AnimeRelationViewEdge {
  readonly animeId: string
  readonly kind: AnimeRelationViewKind
}

export function groupRelationsByOwner(
  selfId: string,
  edges: ReadonlyArray<AnimeRelationViewEdge>,
): Map<string, AnimeRelationEdge[]> {
  const byOwner = new Map<string, AnimeRelationEdge[]>()
  for (const edge of edges) {
    const canonical = canonicalizeRelation(selfId, edge.animeId, edge.kind)
    const list = byOwner.get(canonical.sourceId) ?? []
    list.push(canonical)
    byOwner.set(canonical.sourceId, list)
  }
  return byOwner
}
