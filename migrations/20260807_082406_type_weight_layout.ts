import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_twt_layout" AS ENUM('slider', 'specimen');
  ALTER TABLE "twt" ADD COLUMN "layout" "enum_twt_layout" DEFAULT 'slider';
  ALTER TABLE "_twt_v" ADD COLUMN "layout" "enum_twt_layout" DEFAULT 'slider';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "twt" DROP COLUMN "layout";
  ALTER TABLE "_twt_v" DROP COLUMN "layout";
  DROP TYPE "public"."enum_twt_layout";`)
}
