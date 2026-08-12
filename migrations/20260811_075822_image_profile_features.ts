import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "image_profiles_blocks_color_adjustment" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "line" varchar,
    "background" varchar,
    "block_name" varchar
  );

  CREATE TABLE "image_profiles_blocks_camera_control" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_color_adjustment" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "line" varchar,
    "background" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_image_profiles_v_blocks_camera_control" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar,
    "block_name" varchar
  );

  ALTER TABLE "image_profiles_blocks_color_adjustment" ADD CONSTRAINT "image_profiles_blocks_color_adjustment_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "image_profiles_blocks_camera_control" ADD CONSTRAINT "image_profiles_blocks_camera_control_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_color_adjustment" ADD CONSTRAINT "_image_profiles_v_blocks_color_adjustment_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_blocks_camera_control" ADD CONSTRAINT "_image_profiles_v_blocks_camera_control_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "image_profiles_blocks_color_adjustment_order_idx" ON "image_profiles_blocks_color_adjustment" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_color_adjustment_parent_id_idx" ON "image_profiles_blocks_color_adjustment" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_color_adjustment_path_idx" ON "image_profiles_blocks_color_adjustment" USING btree ("_path");
  CREATE INDEX "image_profiles_blocks_camera_control_order_idx" ON "image_profiles_blocks_camera_control" USING btree ("_order");
  CREATE INDEX "image_profiles_blocks_camera_control_parent_id_idx" ON "image_profiles_blocks_camera_control" USING btree ("_parent_id");
  CREATE INDEX "image_profiles_blocks_camera_control_path_idx" ON "image_profiles_blocks_camera_control" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_color_adjustment_order_idx" ON "_image_profiles_v_blocks_color_adjustment" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_color_adjustment_parent_id_idx" ON "_image_profiles_v_blocks_color_adjustment" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_color_adjustment_path_idx" ON "_image_profiles_v_blocks_color_adjustment" USING btree ("_path");
  CREATE INDEX "_image_profiles_v_blocks_camera_control_order_idx" ON "_image_profiles_v_blocks_camera_control" USING btree ("_order");
  CREATE INDEX "_image_profiles_v_blocks_camera_control_parent_id_idx" ON "_image_profiles_v_blocks_camera_control" USING btree ("_parent_id");
  CREATE INDEX "_image_profiles_v_blocks_camera_control_path_idx" ON "_image_profiles_v_blocks_camera_control" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "image_profiles_blocks_color_adjustment" CASCADE;
  DROP TABLE "image_profiles_blocks_camera_control" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_color_adjustment" CASCADE;
  DROP TABLE "_image_profiles_v_blocks_camera_control" CASCADE;`)
}
