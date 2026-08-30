import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous, Roles } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import { requireAdminUser } from '../../auth/require-user'
import { negotiatedLanguage } from '../localization'
import { GenreService } from './genre.service'

@Controller()
export class GenreController {
  constructor(private readonly genres: GenreService) {}

  @AllowAnonymous()
  @Implement(contract.genre.list)
  list() {
    return implement(contract.genre.list).handler(({ input, context }) =>
      this.genres.list(input, negotiatedLanguage(context)),
    )
  }

  @AllowAnonymous()
  @Implement(contract.genre.get)
  get() {
    return implement(contract.genre.get).handler(({ input, context }) =>
      this.genres.getById(input.id, negotiatedLanguage(context)),
    )
  }

  @Roles(['admin'])
  @Implement(contract.genre.create)
  create() {
    return implement(contract.genre.create).handler(({ input, context }) => {
      const userId = requireAdminUser(context)
      return this.genres.create(input, userId)
    })
  }

  @Roles(['admin'])
  @Implement(contract.genre.update)
  update() {
    return implement(contract.genre.update).handler(({ input, context }) => {
      const userId = requireAdminUser(context)
      const { id, ...patch } = input
      return this.genres.update(id, patch, userId)
    })
  }

  @Roles(['admin'])
  @Implement(contract.genre.remove)
  remove() {
    return implement(contract.genre.remove).handler(
      async ({ input, context }) => {
        const userId = requireAdminUser(context)
        await this.genres.remove(input.id, userId)
        return { success: true }
      },
    )
  }
}
