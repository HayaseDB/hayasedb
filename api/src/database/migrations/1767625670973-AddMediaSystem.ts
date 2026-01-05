import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaSystem1767625670973 implements MigrationInterface {
  name = 'AddMediaSystem1767625670973';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bucket" character varying(63) NOT NULL, "key" character varying(1024) NOT NULL, "original_name" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "size" bigint NOT NULL, "etag" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_73249254969d2292e9bbd08db48" UNIQUE ("bucket", "key"), CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0cfcdafa2eb41d23322141448" ON "media" ("bucket") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profile_picture_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_02ec15de199e79a0c46869895f4" UNIQUE ("profile_picture_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_02ec15de199e79a0c46869895f4" FOREIGN KEY ("profile_picture_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_02ec15de199e79a0c46869895f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_02ec15de199e79a0c46869895f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profile_picture_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c0cfcdafa2eb41d23322141448"`,
    );
    await queryRunner.query(`DROP TABLE "media"`);
  }
}
