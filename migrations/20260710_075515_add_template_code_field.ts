import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" ADD COLUMN "code_css" varchar;
  ALTER TABLE "templates" ADD COLUMN "code_js" varchar;
  ALTER TABLE "_templates_v" ADD COLUMN "version_code_css" varchar;
  ALTER TABLE "_templates_v" ADD COLUMN "version_code_js" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" DROP COLUMN "code_css";
  ALTER TABLE "templates" DROP COLUMN "code_js";
  ALTER TABLE "_templates_v" DROP COLUMN "version_code_css";
  ALTER TABLE "_templates_v" DROP COLUMN "version_code_js";`)
}
