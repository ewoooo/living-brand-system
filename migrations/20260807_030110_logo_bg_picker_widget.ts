import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "lbp" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group_id" integer,
  	"logo_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lbp_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group_id" integer,
  	"logo_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "lbp" ADD CONSTRAINT "lbp_group_id_brand_color_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lbp" ADD CONSTRAINT "lbp_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lbp" ADD CONSTRAINT "lbp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lbp_v" ADD CONSTRAINT "_lbp_v_group_id_brand_color_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."brand_color_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lbp_v" ADD CONSTRAINT "_lbp_v_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lbp_v" ADD CONSTRAINT "_lbp_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lbp_order_idx" ON "lbp" USING btree ("_order");
  CREATE INDEX "lbp_parent_id_idx" ON "lbp" USING btree ("_parent_id");
  CREATE INDEX "lbp_path_idx" ON "lbp" USING btree ("_path");
  CREATE INDEX "lbp_group_idx" ON "lbp" USING btree ("group_id");
  CREATE INDEX "lbp_logo_idx" ON "lbp" USING btree ("logo_id");
  CREATE INDEX "_lbp_v_order_idx" ON "_lbp_v" USING btree ("_order");
  CREATE INDEX "_lbp_v_parent_id_idx" ON "_lbp_v" USING btree ("_parent_id");
  CREATE INDEX "_lbp_v_path_idx" ON "_lbp_v" USING btree ("_path");
  CREATE INDEX "_lbp_v_group_idx" ON "_lbp_v" USING btree ("group_id");
  CREATE INDEX "_lbp_v_logo_idx" ON "_lbp_v" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "lbp" CASCADE;
  DROP TABLE "_lbp_v" CASCADE;`)
}
