import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lgw_sample" AS ENUM('a', 'b', 'c');
  ALTER TABLE "lgw" ADD COLUMN "sample" "enum_lgw_sample" DEFAULT 'a';
  ALTER TABLE "_lgw_v" ADD COLUMN "sample" "enum_lgw_sample" DEFAULT 'a';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lgw" DROP COLUMN "sample";
  ALTER TABLE "_lgw_v" DROP COLUMN "sample";
  DROP TYPE "public"."enum_lgw_sample";`)
}
