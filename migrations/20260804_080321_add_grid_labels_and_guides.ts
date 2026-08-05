import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lgw_guides" AS ENUM('shared', 'on', 'off');
  ALTER TYPE "public"."enum_lgw_sample" ADD VALUE 'grid-labels';
  ALTER TABLE "lgw" ADD COLUMN "guides" "enum_lgw_guides" DEFAULT 'shared';
  ALTER TABLE "_lgw_v" ADD COLUMN "guides" "enum_lgw_guides" DEFAULT 'shared';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lgw" ALTER COLUMN "sample" SET DATA TYPE text;
  ALTER TABLE "lgw" ALTER COLUMN "sample" SET DEFAULT 'a'::text;
  ALTER TABLE "_lgw_v" ALTER COLUMN "sample" SET DATA TYPE text;
  ALTER TABLE "_lgw_v" ALTER COLUMN "sample" SET DEFAULT 'a'::text;
  DROP TYPE "public"."enum_lgw_sample";
  CREATE TYPE "public"."enum_lgw_sample" AS ENUM('a', 'b', 'c');
  ALTER TABLE "lgw" ALTER COLUMN "sample" SET DEFAULT 'a'::"public"."enum_lgw_sample";
  ALTER TABLE "lgw" ALTER COLUMN "sample" SET DATA TYPE "public"."enum_lgw_sample" USING "sample"::"public"."enum_lgw_sample";
  ALTER TABLE "_lgw_v" ALTER COLUMN "sample" SET DEFAULT 'a'::"public"."enum_lgw_sample";
  ALTER TABLE "_lgw_v" ALTER COLUMN "sample" SET DATA TYPE "public"."enum_lgw_sample" USING "sample"::"public"."enum_lgw_sample";
  ALTER TABLE "lgw" DROP COLUMN "guides";
  ALTER TABLE "_lgw_v" DROP COLUMN "guides";
  DROP TYPE "public"."enum_lgw_guides";`)
}
