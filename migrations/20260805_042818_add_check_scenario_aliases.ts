import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "check_scenarios_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_check_scenarios_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "check_scenarios_texts" ADD CONSTRAINT "check_scenarios_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."check_scenarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_check_scenarios_v_texts" ADD CONSTRAINT "_check_scenarios_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_check_scenarios_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "check_scenarios_texts_order_parent" ON "check_scenarios_texts" USING btree ("order","parent_id");
  CREATE INDEX "_check_scenarios_v_texts_order_parent" ON "_check_scenarios_v_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "check_scenarios_texts" CASCADE;
  DROP TABLE "_check_scenarios_v_texts" CASCADE;`)
}
