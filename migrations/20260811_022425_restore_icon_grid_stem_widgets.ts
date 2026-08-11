import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "icw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "scs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_icw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_scs_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "icw" ADD CONSTRAINT "icw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scs" ADD CONSTRAINT "scs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_icw_v" ADD CONSTRAINT "_icw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scs_v" ADD CONSTRAINT "_scs_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "icw_order_idx" ON "icw" USING btree ("_order");
  CREATE INDEX "icw_parent_id_idx" ON "icw" USING btree ("_parent_id");
  CREATE INDEX "icw_path_idx" ON "icw" USING btree ("_path");
  CREATE INDEX "scs_order_idx" ON "scs" USING btree ("_order");
  CREATE INDEX "scs_parent_id_idx" ON "scs" USING btree ("_parent_id");
  CREATE INDEX "scs_path_idx" ON "scs" USING btree ("_path");
  CREATE INDEX "_icw_v_order_idx" ON "_icw_v" USING btree ("_order");
  CREATE INDEX "_icw_v_parent_id_idx" ON "_icw_v" USING btree ("_parent_id");
  CREATE INDEX "_icw_v_path_idx" ON "_icw_v" USING btree ("_path");
  CREATE INDEX "_scs_v_order_idx" ON "_scs_v" USING btree ("_order");
  CREATE INDEX "_scs_v_parent_id_idx" ON "_scs_v" USING btree ("_parent_id");
  CREATE INDEX "_scs_v_path_idx" ON "_scs_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "icw" CASCADE;
  DROP TABLE "scs" CASCADE;
  DROP TABLE "_icw_v" CASCADE;
  DROP TABLE "_scs_v" CASCADE;`)
}
