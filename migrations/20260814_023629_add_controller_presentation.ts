import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles" ADD COLUMN "controller_presentation" jsonb;
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_controller_presentation" jsonb;
  ALTER TABLE "graphic_profiles" ADD COLUMN "controller_presentation" jsonb;
  ALTER TABLE "_graphic_profiles_v" ADD COLUMN "version_controller_presentation" jsonb;
  ALTER TABLE "templates" ADD COLUMN "controller_presentation" jsonb;
  ALTER TABLE "_templates_v" ADD COLUMN "version_controller_presentation" jsonb;

  UPDATE "graphic_profiles"
  SET "controller_presentation" = '{"groups":[{"groupId":"ray-palette","defaultOpen":false},{"groupId":"pulse","defaultOpen":false},{"groupId":"glass-motion","defaultOpen":false}]}'::jsonb
  WHERE "runtime" = 'radial-fluted-glass' AND "controller_presentation" IS NULL;

  UPDATE "_graphic_profiles_v"
  SET "version_controller_presentation" = '{"groups":[{"groupId":"ray-palette","defaultOpen":false},{"groupId":"pulse","defaultOpen":false},{"groupId":"glass-motion","defaultOpen":false}]}'::jsonb
  WHERE "version_runtime" = 'radial-fluted-glass' AND "version_controller_presentation" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles" DROP COLUMN "controller_presentation";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_controller_presentation";
  ALTER TABLE "graphic_profiles" DROP COLUMN "controller_presentation";
  ALTER TABLE "_graphic_profiles_v" DROP COLUMN "version_controller_presentation";
  ALTER TABLE "templates" DROP COLUMN "controller_presentation";
  ALTER TABLE "_templates_v" DROP COLUMN "version_controller_presentation";`)
}
