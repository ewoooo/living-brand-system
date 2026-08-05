import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "lgw_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_lgw_v_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "lgw_locales" ADD CONSTRAINT "lgw_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lgw"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgw_v_locales" ADD CONSTRAINT "_lgw_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lgw_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "lgw_locales_locale_parent_id_unique" ON "lgw_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_lgw_v_locales_locale_parent_id_unique" ON "_lgw_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "lgw_locales" CASCADE;
  DROP TABLE "_lgw_v_locales" CASCADE;`)
}
