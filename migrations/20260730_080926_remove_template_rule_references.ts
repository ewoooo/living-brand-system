import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "templates_template_checks" CASCADE;
  DROP TABLE "templates_template_checks_locales" CASCADE;
  DROP TABLE "_templates_v_version_template_checks" CASCADE;
  DROP TABLE "_templates_v_version_template_checks_locales" CASCADE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "templates_template_checks" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "check_key" varchar
  );

  CREATE TABLE "templates_template_checks_locales" (
    "body" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_templates_v_version_template_checks" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "check_key" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_templates_v_version_template_checks_locales" (
    "body" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  ALTER TABLE "templates_template_checks" ADD CONSTRAINT "templates_template_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_template_checks_locales" ADD CONSTRAINT "templates_template_checks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates_template_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_checks" ADD CONSTRAINT "_templates_v_version_template_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_checks_locales" ADD CONSTRAINT "_templates_v_version_template_checks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v_version_template_checks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "templates_template_checks_order_idx" ON "templates_template_checks" USING btree ("_order");
  CREATE INDEX "templates_template_checks_parent_id_idx" ON "templates_template_checks" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "templates_template_checks_locales_locale_parent_id_unique" ON "templates_template_checks_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_templates_v_version_template_checks_order_idx" ON "_templates_v_version_template_checks" USING btree ("_order");
  CREATE INDEX "_templates_v_version_template_checks_parent_id_idx" ON "_templates_v_version_template_checks" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_templates_v_version_template_checks_locales_locale_parent_i" ON "_templates_v_version_template_checks_locales" USING btree ("_locale","_parent_id");`)
}
