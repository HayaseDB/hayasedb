import {
  ANIME_RELATION_KINDS,
  groupRelationsByOwner,
  type AnimeRelationEdge,
  type AnimeRelationKind,
  type AnimeRelationViewEdge,
  type AnimeRelationViewKind,
} from '@hayasedb/domain'
import type { AnimeDocumentRelation } from '@hayasedb/contract'

export interface AnimeRelationInput {
  edges: AnimeRelationViewEdge[]
  baseline: AnimeRelationViewEdge[]
}

export interface ForeignRelationUpdate {
  animeId: string
  headRev: number
  relations: AnimeDocumentRelation[]
}

export interface AnimeRelationPlan {
  own: AnimeDocumentRelation[]
  ownChanged: boolean
  foreign: ForeignRelationUpdate[]
}

function toStoredKind(kind: AnimeRelationViewKind): AnimeRelationKind {
  if (!(ANIME_RELATION_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`Owned relation has non-canonical kind ${kind}`)
  }
  return kind as AnimeRelationKind
}

function toDocument(edges: AnimeRelationEdge[]): AnimeDocumentRelation[] {
  return edges
    .map(({ targetId, kind }) => ({ targetId, kind }))
    .sort((a, b) =>
      a.targetId === b.targetId
        ? a.kind.localeCompare(b.kind)
        : a.targetId.localeCompare(b.targetId),
    )
}

function sameList(
  a: AnimeDocumentRelation[],
  b: AnimeDocumentRelation[],
): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useAnimeRelationPlan() {
  const api = useApiClient()

  async function plan(
    selfId: string,
    input: AnimeRelationInput,
  ): Promise<AnimeRelationPlan> {
    const next = groupRelationsByOwner(selfId, input.edges)
    const previous = groupRelationsByOwner(selfId, input.baseline)
    const own = toDocument(next.get(selfId) ?? [])
    const ownChanged = !sameList(own, toDocument(previous.get(selfId) ?? []))
    const owners = new Set([...next.keys(), ...previous.keys()])
    owners.delete(selfId)

    const foreign: ForeignRelationUpdate[] = []
    for (const ownerId of owners) {
      const other = await api.anime.getById({ id: ownerId })
      const owned = other.relations
        .filter((relation) => relation.owned)
        .map((relation): AnimeRelationEdge => ({
          sourceId: ownerId,
          targetId: relation.anime.id,
          kind: toStoredKind(relation.kind),
        }))
      const kept = owned.filter((edge) => edge.targetId !== selfId)
      const relations = toDocument([...kept, ...(next.get(ownerId) ?? [])])
      const current = toDocument(owned)
      if (!sameList(current, relations)) {
        foreign.push({ animeId: ownerId, headRev: other.headRev, relations })
      }
    }

    return { own, ownChanged, foreign }
  }

  return { plan }
}
