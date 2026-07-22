import { Controller } from '@nestjs/common'
import { Implement } from '@orpc/nest'
import { implement } from '@orpc/server'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { contract } from '@hayasedb/contract'
import { requireAdminUser } from '../../auth/require-admin'
import { GenreService } from './genre.service'

@Controller()
export class GenreController {
  constructor(private readonly genres: GenreService) {}

  @AllowAnonymous()
  @Implement(contract.genre.list)
  list() {
    return implement(contract.genre.list).handler(async () => ({
      items: await this.genres.list(),
    }))
  }

  @Implement(contract.genre.create)
  create() {
    return implement(contract.genre.create).handler(({ input, context }) => {
      const userId = requireAdminUser(context)
      return this.genres.create(input.name, userId)
    })
  }

  @Implement(contract.genre.update)
  update() {
    return implement(contract.genre.update).handler(({ input, context }) => {
      const userId = requireAdminUser(context)
      return this.genres.update(input.id, input.name, userId)
    })
  }

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
