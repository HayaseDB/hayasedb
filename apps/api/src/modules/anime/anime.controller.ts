import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import { requireAdminUser } from '../../auth/require-admin'
import { AnimeService } from './anime.service'
import { MediaService } from './media.service'

@Controller()
export class AnimeController {
  constructor(
    private readonly anime: AnimeService,
    private readonly media: MediaService,
  ) {}

  @AllowAnonymous()
  @Implement(contract.anime.list)
  list() {
    return implement(contract.anime.list).handler(({ input, context }) =>
      this.anime.list(input, {
        isAdmin: context.request.user?.role === 'admin',
      }),
    )
  }

  @AllowAnonymous()
  @Implement(contract.anime.getBySlug)
  getBySlug() {
    return implement(contract.anime.getBySlug).handler(({ input, context }) =>
      this.anime.getBySlug(input.slug, {
        includeDeleted: context.request.user?.role === 'admin',
      }),
    )
  }

  @AllowAnonymous()
  @Implement(contract.anime.getById)
  getById() {
    return implement(contract.anime.getById).handler(({ input, context }) =>
      this.anime.getById(input.id, {
        includeDeleted: context.request.user?.role === 'admin',
      }),
    )
  }

  @Implement(contract.anime.create)
  create() {
    return implement(contract.anime.create).handler(({ input, context }) => {
      const editorId = requireAdminUser(context)
      return this.anime.create(input, editorId)
    })
  }

  @Implement(contract.anime.update)
  update() {
    return implement(contract.anime.update).handler(({ input, context }) => {
      const editorId = requireAdminUser(context)
      return this.anime.update(input, editorId)
    })
  }

  @Implement(contract.anime.remove)
  remove() {
    return implement(contract.anime.remove).handler(
      async ({ input, context }) => {
        const editorId = requireAdminUser(context)
        await this.anime.remove(input.id, editorId)
        return { success: true }
      },
    )
  }

  @Implement(contract.anime.addMedia)
  addMedia() {
    return implement(contract.anime.addMedia).handler(
      async ({ input, context }) => {
        const editorId = requireAdminUser(context)
        const asset = await this.media.ingest(input.file, input.file.name)
        return this.anime.attachMedia(
          {
            animeId: input.animeId,
            mediaId: asset.id,
            type: input.type,
          },
          editorId,
        )
      },
    )
  }

  @Implement(contract.anime.removeMedia)
  removeMedia() {
    return implement(contract.anime.removeMedia).handler(
      ({ input, context }) => {
        const editorId = requireAdminUser(context)
        return this.anime.removeMedia(input.id, editorId)
      },
    )
  }

  @Implement(contract.anime.reorderMedia)
  reorderMedia() {
    return implement(contract.anime.reorderMedia).handler(
      ({ input, context }) => {
        const editorId = requireAdminUser(context)
        return this.anime.reorderMedia(input, editorId)
      },
    )
  }
}
