import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1767644740905 implements MigrationInterface {
  name = 'Init1767644740905';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bucket" character varying(63) NOT NULL, "key" character varying(1024) NOT NULL, "original_name" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "size" bigint NOT NULL, "etag" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_73249254969d2292e9bbd08db48" UNIQUE ("bucket", "key"), CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0cfcdafa2eb41d23322141448" ON "media" ("bucket") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('administrator', 'moderator', 'user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(50) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "email_verified_at" TIMESTAMP WITH TIME ZONE, "email_verification_token" character varying(64), "email_verification_expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "profile_picture_id" uuid, CONSTRAINT "REL_02ec15de199e79a0c46869895f" UNIQUE ("profile_picture_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sessions_device_type_enum" AS ENUM('Mobile', 'Tablet', 'Desktop', 'Unknown')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hash" character varying(255) NOT NULL, "browser" character varying(100), "browser_version" character varying(50), "os" character varying(100), "os_version" character varying(50), "device_type" "public"."sessions_device_type_enum" NOT NULL DEFAULT 'Unknown', "ip_address" character varying(45), "user_agent" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_02ec15de199e79a0c46869895f4" FOREIGN KEY ("profile_picture_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_02ec15de199e79a0c46869895f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_085d540d9f418cfbdc7bd55bb1"`,
    );
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TYPE "public"."sessions_device_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c0cfcdafa2eb41d23322141448"`,
    );
    await queryRunner.query(`DROP TABLE "media"`);
  }
}
