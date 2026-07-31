import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_templates_print_ppi" AS ENUM('72', '150', '300');
  CREATE TYPE "public"."enum__templates_v_version_print_ppi" AS ENUM('72', '150', '300');
  ALTER TABLE "templates" ADD COLUMN "print_ppi" "enum_templates_print_ppi";
  ALTER TABLE "_templates_v" ADD COLUMN "version_print_ppi" "enum__templates_v_version_print_ppi";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" DROP COLUMN "print_ppi";
  ALTER TABLE "_templates_v" DROP COLUMN "version_print_ppi";
  DROP TYPE "public"."enum_templates_print_ppi";
  DROP TYPE "public"."enum__templates_v_version_print_ppi";`)
}
