import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD COLUMN "logo_real_height_px" numeric;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD COLUMN "logo_real_height_px" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_blocks_logo_viewer" DROP COLUMN "logo_real_height_px";
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" DROP COLUMN "logo_real_height_px";`)
}
