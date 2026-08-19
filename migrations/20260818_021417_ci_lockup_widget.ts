import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "cil" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cil_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "cil" ADD CONSTRAINT "cil_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cil_v" ADD CONSTRAINT "_cil_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cil_order_idx" ON "cil" USING btree ("_order");
  CREATE INDEX "cil_parent_id_idx" ON "cil" USING btree ("_parent_id");
  CREATE INDEX "cil_path_idx" ON "cil" USING btree ("_path");
  CREATE INDEX "_cil_v_order_idx" ON "_cil_v" USING btree ("_order");
  CREATE INDEX "_cil_v_parent_id_idx" ON "_cil_v" USING btree ("_parent_id");
  CREATE INDEX "_cil_v_path_idx" ON "_cil_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cil" CASCADE;
  DROP TABLE "_cil_v" CASCADE;`)
}
