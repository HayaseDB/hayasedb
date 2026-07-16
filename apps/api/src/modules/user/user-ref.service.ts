import { Inject, Injectable } from '@nestjs/common'
import { inArray } from 'drizzle-orm'
import type { ChangesetAuthor } from '@hayasedb/contract'
import { type Database, schema } from '@hayasedb/db'
import { DRIZZLE } from '../../database/database.constants'

export const NULL_AUTHOR: ChangesetAuthor = {
  id: null,
  name: null,
  image: null,
}

@Injectable()
export class UserRefService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async loadAuthors(
    ids: ReadonlyArray<string | null>,
  ): Promise<Map<string, ChangesetAuthor>> {
    const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))]
    if (unique.length === 0) return new Map()

    const rows = await this.db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        image: schema.user.image,
      })
      .from(schema.user)
      .where(inArray(schema.user.id, unique))

    return new Map(
      rows.map((row) => [
        row.id,
        { id: row.id, name: row.name, image: row.image },
      ]),
    )
  }

  async loadAuthor(id: string | null): Promise<ChangesetAuthor> {
    if (!id) return NULL_AUTHOR
    return (await this.loadAuthors([id])).get(id) ?? NULL_AUTHOR
  }
}
