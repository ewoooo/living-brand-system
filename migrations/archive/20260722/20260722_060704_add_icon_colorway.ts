import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "icon_colorway_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon_id" integer NOT NULL,
  	"fg_id" integer NOT NULL,
  	"bg_id" integer NOT NULL
  );
  
  CREATE TABLE "icon_colorway" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "icon_colorway_entries" ADD CONSTRAINT "icon_colorway_entries_icon_id_brand_icons_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."brand_icons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "icon_colorway_entries" ADD CONSTRAINT "icon_colorway_entries_fg_id_brand_colors_id_fk" FOREIGN KEY ("fg_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "icon_colorway_entries" ADD CONSTRAINT "icon_colorway_entries_bg_id_brand_colors_id_fk" FOREIGN KEY ("bg_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "icon_colorway_entries" ADD CONSTRAINT "icon_colorway_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."icon_colorway"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "icon_colorway_entries_order_idx" ON "icon_colorway_entries" USING btree ("_order");
  CREATE INDEX "icon_colorway_entries_parent_id_idx" ON "icon_colorway_entries" USING btree ("_parent_id");
  CREATE INDEX "icon_colorway_entries_icon_idx" ON "icon_colorway_entries" USING btree ("icon_id");
  CREATE INDEX "icon_colorway_entries_fg_idx" ON "icon_colorway_entries" USING btree ("fg_id");
  CREATE INDEX "icon_colorway_entries_bg_idx" ON "icon_colorway_entries" USING btree ("bg_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "icon_colorway_entries" CASCADE;
  DROP TABLE "icon_colorway" CASCADE;`)
}
