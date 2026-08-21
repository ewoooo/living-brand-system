import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles_blocks_camera_control" ADD COLUMN "azimuths" jsonb;
  ALTER TABLE "image_profiles_blocks_camera_control" ADD COLUMN "elevations" jsonb;
  ALTER TABLE "_image_profiles_v_blocks_camera_control" ADD COLUMN "azimuths" jsonb;
  ALTER TABLE "_image_profiles_v_blocks_camera_control" ADD COLUMN "elevations" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "image_profiles_blocks_camera_control" DROP COLUMN "azimuths";
  ALTER TABLE "image_profiles_blocks_camera_control" DROP COLUMN "elevations";
  ALTER TABLE "_image_profiles_v_blocks_camera_control" DROP COLUMN "azimuths";
  ALTER TABLE "_image_profiles_v_blocks_camera_control" DROP COLUMN "elevations";`)
}
