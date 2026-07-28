import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_blocks_image_grid_locales" ADD COLUMN "description" jsonb;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_locales" ADD COLUMN "description" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_blocks_image_grid_locales" DROP COLUMN "description";
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_locales" DROP COLUMN "description";`)
}
