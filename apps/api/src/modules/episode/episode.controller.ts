import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous, Roles } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import { requireAdminUser } from '../../auth/require-user'
import { EpisodeService } from './episode.service'

@Controller()
export class EpisodeController {
  constructor(private readonly episodes: EpisodeService) {}

  @AllowAnonymous()
  @Implement(contract.season.list)
  listSeasons() {
    return implement(contract.season.list).handler(({ input }) =>
      this.episodes.listSeasons(input.animeId, input.limit, input.cursor),
    )
  }

  @AllowAnonymous()
  @Implement(contract.season.get)
  getSeason() {
    return implement(contract.season.get).handler(({ input }) =>
      this.episodes.getSeason(input.id),
    )
  }

  @Roles(['admin'])
  @Implement(contract.season.create)
  createSeason() {
    return implement(contract.season.create).handler(
      async ({ input, context }) => {
        const season = await this.episodes.createSeason(
          input,
          requireAdminUser(context),
        )
        context.resHeaders?.set('Location', `/api/seasons/${season.id}`)
        return season
      },
    )
  }

  @Roles(['admin'])
  @Implement(contract.season.update)
  updateSeason() {
    return implement(contract.season.update).handler(({ input, context }) =>
      this.episodes.updateSeason(input, requireAdminUser(context)),
    )
  }

  @Roles(['admin'])
  @Implement(contract.season.remove)
  removeSeason() {
    return implement(contract.season.remove).handler(
      async ({ input, context }) => {
        await this.episodes.removeSeason(input.id, requireAdminUser(context))
      },
    )
  }

  @Roles(['admin'])
  @Implement(contract.season.reorder)
  reorderSeasons() {
    return implement(contract.season.reorder).handler(({ input, context }) =>
      this.episodes.reorderSeasons(input, requireAdminUser(context)),
    )
  }

  @AllowAnonymous()
  @Implement(contract.episode.listForAnime)
  listEpisodesForAnime() {
    return implement(contract.episode.listForAnime).handler(({ input }) =>
      this.episodes.listEpisodesForAnime(
        input.animeId,
        input.seasonId,
        input.limit,
        input.cursor,
      ),
    )
  }

  @AllowAnonymous()
  @Implement(contract.episode.listForSeason)
  listEpisodesForSeason() {
    return implement(contract.episode.listForSeason).handler(({ input }) =>
      this.episodes.listEpisodesForSeason(
        input.seasonId,
        input.limit,
        input.cursor,
      ),
    )
  }

  @AllowAnonymous()
  @Implement(contract.episode.get)
  getEpisode() {
    return implement(contract.episode.get).handler(({ input }) =>
      this.episodes.getEpisode(input.id),
    )
  }

  @Roles(['admin'])
  @Implement(contract.episode.createForAnime)
  createEpisodeForAnime() {
    return implement(contract.episode.createForAnime).handler(
      async ({ input, context }) => {
        const episode = await this.episodes.createEpisodeForAnime(
          input,
          requireAdminUser(context),
        )
        context.resHeaders?.set('Location', `/api/episodes/${episode.id}`)
        return episode
      },
    )
  }

  @Roles(['admin'])
  @Implement(contract.episode.createForSeason)
  createEpisodeForSeason() {
    return implement(contract.episode.createForSeason).handler(
      async ({ input, context }) => {
        const episode = await this.episodes.createEpisodeForSeason(
          input,
          requireAdminUser(context),
        )
        context.resHeaders?.set('Location', `/api/episodes/${episode.id}`)
        return episode
      },
    )
  }

  @Roles(['admin'])
  @Implement(contract.episode.update)
  updateEpisode() {
    return implement(contract.episode.update).handler(({ input, context }) =>
      this.episodes.updateEpisode(input, requireAdminUser(context)),
    )
  }

  @Roles(['admin'])
  @Implement(contract.episode.remove)
  removeEpisode() {
    return implement(contract.episode.remove).handler(
      async ({ input, context }) => {
        await this.episodes.removeEpisode(input.id, requireAdminUser(context))
      },
    )
  }

  @Roles(['admin'])
  @Implement(contract.episode.reorderForAnime)
  reorderEpisodesForAnime() {
    return implement(contract.episode.reorderForAnime).handler(
      ({ input, context }) =>
        this.episodes.reorderEpisodesForAnime(input, requireAdminUser(context)),
    )
  }

  @Roles(['admin'])
  @Implement(contract.episode.reorderForSeason)
  reorderEpisodesForSeason() {
    return implement(contract.episode.reorderForSeason).handler(
      ({ input, context }) =>
        this.episodes.reorderEpisodesForSeason(
          input,
          requireAdminUser(context),
        ),
    )
  }
}
