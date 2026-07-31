import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" DROP COLUMN "json_template";
  ALTER TABLE "templates" DROP COLUMN "code_css";
  ALTER TABLE "templates" DROP COLUMN "code_js";
  ALTER TABLE "_templates_v" DROP COLUMN "version_json_template";
  ALTER TABLE "_templates_v" DROP COLUMN "version_code_css";
  ALTER TABLE "_templates_v" DROP COLUMN "version_code_js";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" ADD COLUMN "json_template" jsonb;
  ALTER TABLE "templates" ADD COLUMN "code_css" varchar;
  ALTER TABLE "templates" ADD COLUMN "code_js" varchar;
  ALTER TABLE "_templates_v" ADD COLUMN "version_json_template" jsonb;
  ALTER TABLE "_templates_v" ADD COLUMN "version_code_css" varchar;
  ALTER TABLE "_templates_v" ADD COLUMN "version_code_js" varchar;`)
}
