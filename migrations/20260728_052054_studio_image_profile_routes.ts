import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "image_profiles" ADD COLUMN "slug" varchar;
  ALTER TABLE "image_profiles" ADD COLUMN "display_order" numeric DEFAULT 0;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_slug" varchar;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_display_order" numeric DEFAULT 0;
  CREATE UNIQUE INDEX "image_profiles_slug_idx" ON "image_profiles" USING btree ("slug");
  CREATE INDEX "_image_profiles_v_version_version_slug_idx" ON "_image_profiles_v" USING btree ("version_slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "image_profiles_slug_idx";
  DROP INDEX "_image_profiles_v_version_version_slug_idx";
  ALTER TABLE "image_profiles" DROP COLUMN "generate_slug";
  ALTER TABLE "image_profiles" DROP COLUMN "slug";
  ALTER TABLE "image_profiles" DROP COLUMN "display_order";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_slug";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_display_order";`)
}
