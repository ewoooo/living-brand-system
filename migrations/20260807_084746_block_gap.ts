import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_block_gap" AS ENUM('default', 'none');
  ALTER TABLE "blk" ADD COLUMN "gap" "enum_block_gap" DEFAULT 'default';
  ALTER TABLE "_blk_v" ADD COLUMN "gap" "enum_block_gap" DEFAULT 'default';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blk" DROP COLUMN "gap";
  ALTER TABLE "_blk_v" DROP COLUMN "gap";
  DROP TYPE "public"."enum_block_gap";`)
}
