import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "section_cu_locales" CASCADE;
  DROP TABLE "_section_cu_v_locales" CASCADE;
  DROP TABLE "guideline_pages_blocks_column_unit_locales" CASCADE;
  DROP TABLE "_guideline_pages_v_blocks_column_unit_locales" CASCADE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "section_cu_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_section_cu_v_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "guideline_pages_blocks_column_unit_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_pages_v_blocks_column_unit_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "section_cu_locales" ADD CONSTRAINT "section_cu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."section_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_cu_v_locales" ADD CONSTRAINT "_section_cu_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_section_cu_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_pages_blocks_column_unit_locales" ADD CONSTRAINT "guideline_pages_blocks_column_unit_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_blocks_column_unit_locales" ADD CONSTRAINT "_guideline_pages_v_blocks_column_unit_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "section_cu_locales_locale_parent_id_unique" ON "section_cu_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_section_cu_v_locales_locale_parent_id_unique" ON "_section_cu_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "guideline_pages_blocks_column_unit_locales_locale_parent_id_" ON "guideline_pages_blocks_column_unit_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_guideline_pages_v_blocks_column_unit_locales_locale_parent_" ON "_guideline_pages_v_blocks_column_unit_locales" USING btree ("_locale","_parent_id");`)
}
