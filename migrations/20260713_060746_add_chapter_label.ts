import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_chapters_locales" ADD COLUMN "label" varchar;
  ALTER TABLE "_guideline_chapters_v_locales" ADD COLUMN "version_label" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_chapters_locales" DROP COLUMN "label";
  ALTER TABLE "_guideline_chapters_v_locales" DROP COLUMN "version_label";`)
}
