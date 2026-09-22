import { log } from '../../../tui'
import { withDb } from '../../../context'
import { findUserByEmail } from '../../../users'
import type { ApiClient } from '../../api-client'
import type { SeedAnime, SeedContext, SeedStep } from '../../types'
import { SEED_ANIME } from './data/anime'
import { cycleAt, romajiTitle, withEnglishNote } from './steps'
import { SEED_USERS } from './data/users'

const PAGE_SIZE = 100

const SERVER_PENDING_CAP = 10

const MAX_OPEN_PER_AUTHOR = 6

interface HistoryTarget {
  id: string
  headRev: number
}

interface Author {
  client: ApiClient
  id: string
  name: string
}

function englishTitle(entry: SeedAnime): string {
  return (
    entry.translations.find((translation) => translation.locale === 'en')
      ?.title ?? romajiTitle(entry)
  )
}

const MERGED_NOTES = [
  'Added the production studio credit that was missing.',
  'Expanded the premise with context from the source manga.',
  'Reworded the synopsis to match our house style guide.',
  'Filled in the broadcast history for the late-night rerun.',
  'Cited the official site for the staff list.',
  'Clarified the relationship to the parent series.',
]

const PENDING_NOTES = [
  'Proposes a fuller plot summary sourced from the official site.',
  'Adds the streaming availability note requested in the forums.',
  'Rewrites the synopsis to remove late-series spoilers.',
  'Documents the alternate English title used on home video.',
]

const REJECTED_NOTES = [
  'Replaces the synopsis with the publisher blurb.',
  'Adds a fan-translated subtitle as the official title.',
  'Rewrites the premise from a personal review.',
  'Merges the sequel description into this entry.',
]

const WITHDRAWN_NOTES = [
  'Drafts a longer synopsis, still checking sources.',
  'Proposes a genre change pending a second opinion.',
  'Adds staff credits copied from a wiki mirror.',
]

const SUPERSEDED_NOTES = [
  'First pass at expanding the synopsis.',
  'Initial draft of the broadcast history section.',
]

const REVIEW_APPROVALS = [
  'Checked against the official site, this matches. Merging.',
  'Sources look solid and the tone fits the style guide. Approved.',
  'Verified the credit against the ending sequence. Good catch.',
  'Cross-checked with the press kit, all accurate. Merging this.',
]

const REVIEW_QUESTIONS = [
  'Thanks for this. Could you point me at the source for the studio credit?',
  'Looks reasonable. Where did the air dates come from?',
  'Good direction. Can you confirm this against the official site before I merge?',
]

const AUTHOR_REPLIES = [
  'Sure, it is on the official site under the staff page. Linked in the summary now.',
  'Taken from the physical release booklet, page 4. Happy to rephrase if needed.',
  'Confirmed against the broadcaster listing, the dates line up.',
]

const REJECTION_REASONS = [
  'Publisher marketing copy is not usable here, we need a neutral summary written in our own words.',
  'We only list titles that appear on an official release. Fan translations are out of scope.',
  'This reads as a personal review rather than a neutral description, so I have to decline it.',
  'That content belongs on the sequel entry, not this one. Please resubmit it there.',
]

const SUPERSEDE_NOTES = [
  'Good start, but the second paragraph still needs a source. Can you revise?',
  'Almost there. Please trim the plot detail past episode three and resubmit.',
]

const PENDING_ACKS = [
  'Thanks for the submission, taking a look this week.',
  'Queued for review. Looks promising at a glance.',
  'Picking this up after the current batch, thanks for your patience.',
]

async function headRevOf(client: ApiClient, id: string): Promise<number> {
  const detail = await client.anime.get({ id })
  return detail.headRev
}

async function resolveAnime(
  client: ApiClient,
  slug: string,
): Promise<HistoryTarget | null> {
  const { items } = await client.anime.list({ slug, limit: 1 })
  const found = items[0]
  if (!found) return null
  const detail = await client.anime.get({ id: found.id })
  return { id: detail.id, headRev: detail.headRev }
}

export const historyStep: SeedStep = {
  name: 'history',
  description:
    'Build a branching revision history of moderated submissions and direct edits',
  dependsOn: ['contributions'],
  async run(context: SeedContext) {
    const members = SEED_USERS.filter((user) => user.role === 'user')
    const moderators = SEED_USERS.filter((user) => user.role === 'admin')
    if (members.length === 0 || moderators.length === 0) {
      throw new Error('Demo history seed requires a member and an admin user')
    }

    const admin = await context.client()

    const seen = new Set<string>()
    for (const status of [
      'pending',
      'approved',
      'rejected',
      'withdrawn',
      'superseded',
    ] as const) {
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { items, meta } = await admin.changeset.list({
          status,
          limit: PAGE_SIZE,
          offset,
        })
        for (const changeset of items) seen.add(changeset.summary)
        if (offset + items.length >= meta.total || items.length === 0) break
      }
    }

    const authorClients = await Promise.all(
      members.map((member) => context.clientFor(member)),
    )
    const moderatorClients = await Promise.all(
      moderators.map((moderator) => context.clientFor(moderator)),
    )

    const authors: Author[] = await withDb(context.env, async (db) =>
      Promise.all(
        members.map(async (member, position) => {
          const row = await findUserByEmail(db, member.email)
          if (!row) throw new Error(`Seed user ${member.email} is missing`)
          return {
            client: authorClients[position]!,
            id: row.id,
            name: member.name,
          }
        }),
      ),
    )

    const livePendingCount = async (authorId: string): Promise<number> => {
      const { meta } = await admin.changeset.list({
        status: 'pending',
        authorId,
        limit: 1,
        offset: 0,
      })
      return meta.total
    }

    const reserved = new Map<string, number>()

    const release = (authorId: string) => {
      const held = reserved.get(authorId) ?? 0
      if (held > 0) reserved.set(authorId, held - 1)
    }

    const authorWithHeadroom = async (
      limit: number,
      offset: number,
      exclude: ReadonlySet<string> = new Set(),
    ): Promise<Author | undefined> => {
      for (let step = 0; step < authors.length; step += 1) {
        const candidate = cycleAt(authors, offset + step)
        if (exclude.has(candidate.id)) continue
        const held = reserved.get(candidate.id) ?? 0
        if ((await livePendingCount(candidate.id)) + held < limit) {
          reserved.set(candidate.id, held + 1)
          return candidate
        }
      }
      return undefined
    }

    const reviewer = moderatorClients[0]!

    for (const candidate of authors) {
      let backlog = await livePendingCount(candidate.id)
      if (backlog <= MAX_OPEN_PER_AUTHOR) continue
      for (let offset = 0; backlog > MAX_OPEN_PER_AUTHOR;) {
        const { items, meta } = await admin.changeset.list({
          status: 'pending',
          authorId: candidate.id,
          limit: PAGE_SIZE,
          offset,
        })
        if (items.length === 0) break
        for (const changeset of items) {
          if (backlog <= MAX_OPEN_PER_AUTHOR) break
          await reviewer.changeset.approve({ id: changeset.id })
          backlog -= 1
        }
        if (offset + items.length >= meta.total) break
        offset += PAGE_SIZE
      }
      log.info(`Cleared review backlog down to ${backlog} pending.`)
    }

    interface OpenItem {
      entry: SeedAnime
      target: HistoryTarget
      label: string
      index: number
      moderator: ApiClient
    }

    const openQueue: OpenItem[] = []

    const branchPayload = (entry: SeedAnime, note: string, slot: number) => {
      if (slot % 3 === 1) return { format: entry.format }
      if (slot % 3 === 2) {
        return { startDate: entry.startDate, endDate: entry.endDate }
      }
      return { translations: withEnglishNote(entry, note) }
    }

    const submit = async (
      author: Author,
      target: HistoryTarget,
      entry: SeedAnime,
      summary: string,
      forkRev: number,
      note = summary,
      slot = 0,
    ) =>
      author.client.changeset.submit({
        summary,
        changes: [
          {
            op: 'update',
            entityKind: 'anime',
            entityId: target.id,
            baseRev: forkRev,
            payload: branchPayload(entry, note, slot),
          },
        ],
      })

    let built = 0
    let mergedCount = 0
    let rejectedCount = 0
    let withdrawnCount = 0
    let supersededCount = 0
    let directCount = 0
    let revertCount = 0

    for (const [index, entry] of SEED_ANIME.entries()) {
      const target = await resolveAnime(admin, entry.slug)
      if (!target) {
        log.info(`Skipping history for "${entry.slug}", anime not found.`)
        continue
      }

      const moderator = cycleAt(moderatorClients, index)
      const label = romajiTitle(entry)

      if (seen.has(`${cycleAt(MERGED_NOTES, index)} (${label})`)) {
        log.info(`History for "${entry.slug}" already seeded.`)
        continue
      }

      const mergedBranches = 2 + (index % 2)
      const wantsRejection = index % 3 === 0
      const wantsWithdrawal = index % 5 === 0
      const wantsSupersede = index % 7 === 0
      const wantsOpen = index % 4 === 0

      let headRev = await headRevOf(admin, target.id)

      const directEdit = async () => {
        const detour = entry.status === 'HIATUS' ? 'RELEASING' : 'HIATUS'
        await admin.anime.update({ id: target.id, status: detour })
        await admin.anime.update({ id: target.id, status: entry.status })
        directCount += 2
      }

      interface OpenBranch {
        id: string
        summary: string
        author: Author
        forkRev: number
      }

      const inFlight: OpenBranch[] = []

      const busy = new Set<string>()
      for (let step = 0; step < mergedBranches; step += 1) {
        const summary = `${cycleAt(MERGED_NOTES, index + step)} (${label})`
        if (seen.has(summary)) continue
        const contributor = await authorWithHeadroom(
          SERVER_PENDING_CAP,
          index + step,
          busy,
        )
        if (!contributor) break
        busy.add(contributor.id)

        const forkRev = Math.max(1, headRev - step)
        const submitted = await submit(
          contributor,
          target,
          entry,
          summary,
          forkRev,
          summary,
          step,
        )

        if ((index + step) % 2 === 0) {
          await moderator.changeset.addMessage({
            id: submitted.id,
            body: cycleAt(REVIEW_QUESTIONS, index + step),
          })
          await contributor.client.changeset.addMessage({
            id: submitted.id,
            body: cycleAt(AUTHOR_REPLIES, index + step),
          })
        }

        inFlight.push({
          id: submitted.id,
          summary,
          author: contributor,
          forkRev,
        })

        await directEdit()
      }

      for (const [position, branch] of [...inFlight].reverse().entries()) {
        await moderator.changeset.addMessage({
          id: branch.id,
          body: cycleAt(REVIEW_APPROVALS, index + position),
        })
        try {
          await moderator.changeset.approve({ id: branch.id })
          release(branch.author.id)
        } catch {
          release(branch.author.id)
          log.info(`Left "${branch.summary}" pending, it no longer applies.`)
          continue
        }
        seen.add(branch.summary)
        mergedCount += 1
        if (position === 0) await directEdit()
      }

      headRev = await headRevOf(admin, target.id)

      if (index % 6 === 0 && headRev > 2) {
        const { items } = await admin.revision.list({
          entityKind: 'anime',
          entityId: target.id,
          limit: PAGE_SIZE,
          offset: 0,
        })
        const undo = items.find((item) => item.rev === headRev - 1)
        if (undo) {
          try {
            await admin.revision.revert({ id: undo.id })
            revertCount += 1
            headRev = await headRevOf(admin, target.id)
          } catch {
            log.info(`Could not revert r${headRev - 1} of "${entry.slug}".`)
          }
        }
      }

      if (wantsRejection) {
        const summary = `${cycleAt(REJECTED_NOTES, index)} (${label})`
        const contributor = seen.has(summary)
          ? undefined
          : await authorWithHeadroom(SERVER_PENDING_CAP, index)
        if (contributor) {
          const submitted = await submit(
            contributor,
            target,
            entry,
            summary,
            headRev,
            `${summary} — proposed wording.`,
          )
          await contributor.client.changeset.addMessage({
            id: submitted.id,
            body: `Found this while reading up on ${englishTitle(entry)}, hope it helps.`,
          })
          await moderator.changeset.reject({
            id: submitted.id,
            reason: cycleAt(REJECTION_REASONS, index),
          })
          release(contributor.id)
          seen.add(summary)
          rejectedCount += 1
        }
      }

      if (wantsWithdrawal) {
        const summary = `${cycleAt(WITHDRAWN_NOTES, index)} (${label})`
        const contributor = seen.has(summary)
          ? undefined
          : await authorWithHeadroom(SERVER_PENDING_CAP, index + 1)
        if (contributor) {
          const submitted = await submit(
            contributor,
            target,
            entry,
            summary,
            headRev,
            `${summary} — work in progress.`,
          )
          await moderator.changeset.addMessage({
            id: submitted.id,
            body: 'Happy to review once you have the sources lined up.',
          })
          await contributor.client.changeset.addMessage({
            id: submitted.id,
            body: 'Pulling this back for now, I want to verify the credits first.',
          })
          await contributor.client.changeset.withdraw({ id: submitted.id })
          release(contributor.id)
          seen.add(summary)
          withdrawnCount += 1
        }
      }

      if (wantsSupersede) {
        const summary = `${cycleAt(SUPERSEDED_NOTES, index)} (${label})`
        const revised = `${summary} Revised after review.`
        const contributor = seen.has(summary)
          ? undefined
          : await authorWithHeadroom(SERVER_PENDING_CAP, index + 2)
        if (contributor) {
          const first = await submit(
            contributor,
            target,
            entry,
            summary,
            headRev,
            `${summary} — first pass.`,
          )
          await moderator.changeset.addMessage({
            id: first.id,
            body: cycleAt(SUPERSEDE_NOTES, index),
          })

          const second = await contributor.client.changeset.submit({
            summary: revised,
            supersedesId: first.id,
            changes: [
              {
                op: 'update',
                entityKind: 'anime',
                entityId: target.id,
                baseRev: headRev,
                payload: {
                  translations: withEnglishNote(
                    entry,
                    `${revised} — addresses the review notes.`,
                  ),
                },
              },
            ],
          })
          await moderator.changeset.addMessage({
            id: second.id,
            body: 'That covers it, thanks for the quick turnaround. Merging.',
          })
          await moderator.changeset.approve({ id: second.id })

          release(contributor.id)
          release(contributor.id)
          seen.add(summary)
          seen.add(revised)
          supersededCount += 1
          mergedCount += 1
        }
      }

      if (wantsOpen) {
        openQueue.push({ entry, target, label, index, moderator })

        if (index % 12 === 0) {
          openQueue.push({
            entry,
            target,
            label,
            index: index + 1,
            moderator,
          })
        }
      }

      built += 1
    }

    let openCount = 0
    for (const item of openQueue) {
      const summary = `${cycleAt(PENDING_NOTES, item.index)} (${item.label})`
      if (seen.has(summary)) continue

      const proposer = await authorWithHeadroom(SERVER_PENDING_CAP, item.index)
      if (!proposer) break

      const headRev = await headRevOf(admin, item.target.id)

      const depth = item.index % 4 === 0 ? headRev - 1 : item.index % 3
      const forkRev = Math.max(1, headRev - depth)
      const submitted = await submit(
        proposer,
        item.target,
        item.entry,
        summary,
        forkRev,
        `${summary} — awaiting review.`,
      )
      await item.moderator.changeset.addMessage({
        id: submitted.id,
        body: `${cycleAt(PENDING_ACKS, item.index)} (${englishTitle(item.entry)})`,
      })
      seen.add(summary)
      openCount += 1
    }

    log.success(
      `Built history for ${built} anime: ${mergedCount} merged, ${openCount} open, ` +
        `${rejectedCount} rejected, ${withdrawnCount} withdrawn, ` +
        `${supersededCount} superseded, ${revertCount} reverted, ` +
        `${directCount} direct edits.`,
    )
  },
}
