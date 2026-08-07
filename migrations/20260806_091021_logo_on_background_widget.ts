import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lob_column" AS ENUM('fullColor', 'mono');
  CREATE TABLE "lob" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group_id" integer,
  	"logo_id" integer,
  	"column" "enum_lob_column" DEFAULT 'fullColor',
  	"block_name" varchar
  );
  
  CREATE TABLE "_lob_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group_id" integer,
  	"logo_id" integer,
  	"column" "enum_lob_column" DEFAULT 'fullColor',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "lob" ADD CONSTRAINT "lob_group_id_brand_color_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lob" ADD CONSTRAINT "lob_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lob" ADD CONSTRAINT "lob_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lob_v" ADD CONSTRAINT "_lob_v_group_id_brand_color_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lob_v" ADD CONSTRAINT "_lob_v_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lob_v" ADD CONSTRAINT "_lob_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lob_order_idx" ON "lob" USING btree ("_order");
  CREATE INDEX "lob_parent_id_idx" ON "lob" USING btree ("_parent_id");
  CREATE INDEX "lob_path_idx" ON "lob" USING btree ("_path");
  CREATE INDEX "lob_group_idx" ON "lob" USING btree ("group_id");
  CREATE INDEX "lob_logo_idx" ON "lob" USING btree ("logo_id");
  CREATE INDEX "_lob_v_order_idx" ON "_lob_v" USING btree ("_order");
  CREATE INDEX "_lob_v_parent_id_idx" ON "_lob_v" USING btree ("_parent_id");
  CREATE INDEX "_lob_v_path_idx" ON "_lob_v" USING btree ("_path");
  CREATE INDEX "_lob_v_group_idx" ON "_lob_v" USING btree ("group_id");
  CREATE INDEX "_lob_v_logo_idx" ON "_lob_v" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "lob" CASCADE;
  DROP TABLE "_lob_v" CASCADE;
  DROP TYPE "public"."enum_lob_column";`)
}
