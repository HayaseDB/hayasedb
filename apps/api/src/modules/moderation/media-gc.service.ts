import { Inject, Injectable, Logger } from '@nestjs/common'
import { sql, type SQL } from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import { ENTITY_FIELD_META, ENTITY_KINDS } from '@hayasedb/domain'
import { DRIZZLE } from '../../database/database.constants'
import { StorageService } from '../../storage/storage.service'
import { entityHandler } from '../revision/registry'

const SWEEP_BATCH_SIZE = 500

@Injectable()
export class MediaGcService {
  private readonly logger = new Logger(MediaGcService.name)

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly storage: StorageService,
  ) {}

  private mediaDocumentFields(): Array<{ field: string; idKey: string }> {
    const fields = new Map<string, string>()
    for (const kind of ENTITY_KINDS) {
      for (const [field, meta] of Object.entries(ENTITY_FIELD_META[kind])) {
        if (meta.ref !== 'mediaAsset') continue
        if (meta.refPath && meta.refPath !== 'self') {
          fields.set(field, meta.refPath)
        }
      }
    }
    return [...fields].map(([field, idKey]) => ({ field, idKey }))
  }

  private retentionGuards(): SQL[] {
    const guards: SQL[] = []

    for (const kind of ENTITY_KINDS) {
      const link = entityHandler(kind).mediaLinkTable
      if (!link) continue
      guards.push(sql`
        NOT EXISTS (
          SELECT 1 FROM ${sql.identifier(link.table)} lnk
          WHERE lnk.${sql.identifier(link.mediaIdColumn)} = ma.id
        )
      `)
    }

    const documentFields = this.mediaDocumentFields()

    for (const { field, idKey } of documentFields) {
      guards.push(sql`
        NOT EXISTS (
          SELECT 1
          FROM ${schema.change} c
          JOIN ${schema.changeset} cs ON cs.id = c.changeset_id
          WHERE cs.status IN ('draft', 'pending')
            AND c.payload -> ${field} @> jsonb_build_array(
              jsonb_build_object(${idKey}, ma.id)
            )
        )
      `)
    }

    for (const { field, idKey } of documentFields) {
      guards.push(sql`
        NOT EXISTS (
          SELECT 1 FROM ${schema.entityRevision} er
          WHERE er.snapshot -> ${field} @> jsonb_build_array(
            jsonb_build_object(${idKey}, ma.id)
          )
        )
      `)
    }

    return guards
  }

  async sweep(): Promise<{ deleted: number }> {
    const guards = this.retentionGuards()

    if (guards.length === 0) return { deleted: 0 }

    const deleted = await this.db.transaction(async (tx) => {
      const rows = await tx.execute(sql`
        DELETE FROM ${schema.mediaAsset}
        WHERE id IN (
          SELECT ma.id FROM ${schema.mediaAsset} ma
          WHERE ${sql.join(guards, sql` AND `)}
          LIMIT ${SWEEP_BATCH_SIZE}
        )
        RETURNING storage_key
      `)
      return [...rows].map(
        (row) => (row as { storage_key: string }).storage_key,
      )
    })

    for (const key of deleted) {
      try {
        await this.storage.removeObject(key)
      } catch (error) {
        this.logger.error(
          `Failed to delete swept media object ${key}`,
          error instanceof Error ? error.stack : String(error),
        )
      }
    }

    return { deleted: deleted.length }
  }
}
