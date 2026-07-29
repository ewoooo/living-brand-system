import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_image_profiles_output_size_preset" AS ENUM('square', 'landscape', 'portrait');
  CREATE TYPE "public"."enum__image_profiles_v_version_output_size_preset" AS ENUM('square', 'landscape', 'portrait');
  ALTER TABLE "image_profiles" ADD COLUMN "output_size_preset" "enum_image_profiles_output_size_preset" DEFAULT 'portrait';
  ALTER TABLE "_image_profiles_v" ADD COLUMN "version_output_size_preset" "enum__image_profiles_v_version_output_size_preset" DEFAULT 'portrait';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles" DROP COLUMN "output_size_preset";
  ALTER TABLE "_image_profiles_v" DROP COLUMN "version_output_size_preset";
  DROP TYPE "public"."enum_image_profiles_output_size_preset";
  DROP TYPE "public"."enum__image_profiles_v_version_output_size_preset";`)
}
