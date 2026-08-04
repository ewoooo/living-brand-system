import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "lgc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lgc_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "lgc" ADD CONSTRAINT "lgc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgc_v" ADD CONSTRAINT "_lgc_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lgc_order_idx" ON "lgc" USING btree ("_order");
  CREATE INDEX "lgc_parent_id_idx" ON "lgc" USING btree ("_parent_id");
  CREATE INDEX "lgc_path_idx" ON "lgc" USING btree ("_path");
  CREATE INDEX "_lgc_v_order_idx" ON "_lgc_v" USING btree ("_order");
  CREATE INDEX "_lgc_v_parent_id_idx" ON "_lgc_v" USING btree ("_parent_id");
  CREATE INDEX "_lgc_v_path_idx" ON "_lgc_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "lgc" CASCADE;
  DROP TABLE "_lgc_v" CASCADE;`)
}
