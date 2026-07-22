import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rules" ADD COLUMN "source_block_id" varchar;
  CREATE INDEX "rules_source_source_block_id_idx" ON "rules" USING btree ("source_block_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "rules_source_source_block_id_idx";
  ALTER TABLE "rules" DROP COLUMN "source_block_id";`)
}
