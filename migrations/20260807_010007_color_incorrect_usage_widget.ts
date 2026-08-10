import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "ciu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "_ciu_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "ciu" ADD CONSTRAINT "ciu_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ciu" ADD CONSTRAINT "ciu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ciu_v" ADD CONSTRAINT "_ciu_v_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ciu_v" ADD CONSTRAINT "_ciu_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ciu_order_idx" ON "ciu" USING btree ("_order");
  CREATE INDEX "ciu_parent_id_idx" ON "ciu" USING btree ("_parent_id");
  CREATE INDEX "ciu_path_idx" ON "ciu" USING btree ("_path");
  CREATE INDEX "ciu_logo_idx" ON "ciu" USING btree ("logo_id");
  CREATE INDEX "_ciu_v_order_idx" ON "_ciu_v" USING btree ("_order");
  CREATE INDEX "_ciu_v_parent_id_idx" ON "_ciu_v" USING btree ("_parent_id");
  CREATE INDEX "_ciu_v_path_idx" ON "_ciu_v" USING btree ("_path");
  CREATE INDEX "_ciu_v_logo_idx" ON "_ciu_v" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "ciu" CASCADE;
  DROP TABLE "_ciu_v" CASCADE;`)
}
