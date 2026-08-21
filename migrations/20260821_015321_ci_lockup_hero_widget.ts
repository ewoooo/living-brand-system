import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cih_source" AS ENUM('subsidiary', 'branch');
  CREATE TYPE "public"."enum__cih_v_source" AS ENUM('subsidiary', 'branch');
  CREATE TABLE "cih" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source" "enum_cih_source" DEFAULT 'subsidiary',
  	"h" numeric DEFAULT 160,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cih_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source" "enum__cih_v_source" DEFAULT 'subsidiary',
  	"h" numeric DEFAULT 160,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "cih" ADD CONSTRAINT "cih_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cih_v" ADD CONSTRAINT "_cih_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cih_order_idx" ON "cih" USING btree ("_order");
  CREATE INDEX "cih_parent_id_idx" ON "cih" USING btree ("_parent_id");
  CREATE INDEX "cih_path_idx" ON "cih" USING btree ("_path");
  CREATE INDEX "_cih_v_order_idx" ON "_cih_v" USING btree ("_order");
  CREATE INDEX "_cih_v_parent_id_idx" ON "_cih_v" USING btree ("_parent_id");
  CREATE INDEX "_cih_v_path_idx" ON "_cih_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cih" CASCADE;
  DROP TABLE "_cih_v" CASCADE;
  DROP TYPE "public"."enum_cih_source";
  DROP TYPE "public"."enum__cih_v_source";`)
}
