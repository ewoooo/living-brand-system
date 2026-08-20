import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cil" ADD COLUMN "height_control" boolean DEFAULT false;
  ALTER TABLE "_cil_v" ADD COLUMN "height_control" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cil" DROP COLUMN "height_control";
  ALTER TABLE "_cil_v" DROP COLUMN "height_control";`)
}
