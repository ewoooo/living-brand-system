import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_media_showcase_images" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum_image_scale" DEFAULT '100'
  );

  CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_media_showcase_images" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"image_background_color_id" integer,
	"image_scale" "enum_image_scale" DEFAULT '100',
	"_uuid" varchar
  );

  INSERT INTO "guideline_docs_blocks_media_showcase_images" (
    "_order", "_parent_id", "id", "image_id", "image_background_color_id", "image_scale"
  )
  SELECT
    1,
    "id",
    substring(md5("id" || ':media-showcase-image:1'), 1, 24),
    "image_id",
    "image_background_color_id",
    "image_scale"
  FROM "guideline_docs_blocks_media_showcase"
  WHERE (
    "image_id" IS NOT NULL
    OR "image_background_color_id" IS NOT NULL
    OR "image_scale"::text IS DISTINCT FROM '100'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "guideline_docs_blocks_media_showcase_images" image
    WHERE image."_parent_id" = "guideline_docs_blocks_media_showcase"."id"
  );

  INSERT INTO "_guideline_docs_v_blocks_media_showcase_images" (
    "_order", "_parent_id", "image_id", "image_background_color_id", "image_scale", "_uuid"
  )
  SELECT
    1,
    "id",
    "image_id",
    "image_background_color_id",
    "image_scale",
    substring(md5("id"::text || ':media-showcase-image:1'), 1, 24)
  FROM "_guideline_docs_v_blocks_media_showcase"
  WHERE (
    "image_id" IS NOT NULL
    OR "image_background_color_id" IS NOT NULL
    OR "image_scale"::text IS DISTINCT FROM '100'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "_guideline_docs_v_blocks_media_showcase_images" image
    WHERE image."_parent_id" = "_guideline_docs_v_blocks_media_showcase"."id"
  );

  ALTER TABLE "guideline_docs_blocks_media_showcase" DROP CONSTRAINT "guideline_docs_blocks_media_showcase_image_id_application_images_id_fk";

  ALTER TABLE "guideline_docs_blocks_media_showcase" DROP CONSTRAINT "guideline_docs_blocks_media_showcase_image_background_color_id_brand_colors_id_fk";

  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" DROP CONSTRAINT "_guideline_docs_v_blocks_media_showcase_image_id_application_images_id_fk";

  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" DROP CONSTRAINT "_guideline_docs_v_blocks_media_showcase_image_background_color_id_brand_colors_id_fk";

  DROP INDEX "guideline_docs_blocks_media_showcase_image_idx";
  DROP INDEX "guideline_docs_blocks_media_showcase_image_background_co_idx";
  DROP INDEX "_guideline_docs_v_blocks_media_showcase_image_idx";
  DROP INDEX "_guideline_docs_v_blocks_media_showcase_image_background_idx";
  ALTER TABLE "guideline_docs_blocks_media_showcase_images" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_images_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_images" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_images_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_images" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_images" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_images_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_images" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_images_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_images" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_media_showcase_images_order_idx" ON "guideline_docs_blocks_media_showcase_images" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_media_showcase_images_parent_id_idx" ON "guideline_docs_blocks_media_showcase_images" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_images_image_idx" ON "guideline_docs_blocks_media_showcase_images" USING btree ("image_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_images_image_backgr_idx" ON "guideline_docs_blocks_media_showcase_images" USING btree ("image_background_color_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_images_order_idx" ON "_guideline_docs_v_blocks_media_showcase_images" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_images_parent_id_idx" ON "_guideline_docs_v_blocks_media_showcase_images" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_images_image_idx" ON "_guideline_docs_v_blocks_media_showcase_images" USING btree ("image_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_images_image_bac_idx" ON "_guideline_docs_v_blocks_media_showcase_images" USING btree ("image_background_color_id");
  ALTER TABLE "guideline_docs_blocks_media_showcase" DROP COLUMN "image_id";
  ALTER TABLE "guideline_docs_blocks_media_showcase" DROP COLUMN "image_background_color_id";
  ALTER TABLE "guideline_docs_blocks_media_showcase" DROP COLUMN "image_scale";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" DROP COLUMN "image_id";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" DROP COLUMN "image_background_color_id";
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" DROP COLUMN "image_scale";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_blocks_media_showcase" ADD COLUMN "image_id" integer;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ADD COLUMN "image_background_color_id" integer;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ADD COLUMN "image_scale" "enum_image_scale" DEFAULT '100';
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD COLUMN "image_id" integer;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD COLUMN "image_background_color_id" integer;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD COLUMN "image_scale" "enum_image_scale" DEFAULT '100';

  UPDATE "guideline_docs_blocks_media_showcase" AS parent
  SET
    "image_id" = image."image_id",
    "image_background_color_id" = image."image_background_color_id",
    "image_scale" = image."image_scale"
  FROM (
    SELECT DISTINCT ON ("_parent_id")
      "_parent_id", "image_id", "image_background_color_id", "image_scale"
    FROM "guideline_docs_blocks_media_showcase_images"
    ORDER BY "_parent_id", "_order"
  ) AS image
  WHERE parent."id" = image."_parent_id";

  UPDATE "_guideline_docs_v_blocks_media_showcase" AS parent
  SET
    "image_id" = image."image_id",
    "image_background_color_id" = image."image_background_color_id",
    "image_scale" = image."image_scale"
  FROM (
    SELECT DISTINCT ON ("_parent_id")
      "_parent_id", "image_id", "image_background_color_id", "image_scale"
    FROM "_guideline_docs_v_blocks_media_showcase_images"
    ORDER BY "_parent_id", "_order"
  ) AS image
  WHERE parent."id" = image."_parent_id";

  ALTER TABLE "guideline_docs_blocks_media_showcase_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_images" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_docs_blocks_media_showcase_images" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_media_showcase_images" CASCADE;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_media_showcase_image_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("image_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_image_background_co_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("image_background_color_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_image_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("image_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_image_background_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("image_background_color_id");`)
}
