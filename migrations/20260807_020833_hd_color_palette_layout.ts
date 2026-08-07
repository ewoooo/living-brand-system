import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_hcp_layout" AS ENUM('uniform', 'ranked');
  ALTER TABLE "hcp" ADD COLUMN "layout" "enum_hcp_layout" DEFAULT 'uniform';
  ALTER TABLE "_hcp_v" ADD COLUMN "layout" "enum_hcp_layout" DEFAULT 'uniform';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hcp" DROP COLUMN "layout";
  ALTER TABLE "_hcp_v" DROP COLUMN "layout";
  DROP TYPE "public"."enum_hcp_layout";`)
}
