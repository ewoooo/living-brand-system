import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		CREATE TYPE "public"."enum_image_profiles_output_formats" AS ENUM('png');
		CREATE TYPE "public"."enum__image_profiles_v_version_output_formats" AS ENUM('png');
		CREATE TYPE "public"."enum_graphic_profiles_output_formats" AS ENUM('svg');
		CREATE TYPE "public"."enum__graphic_profiles_v_version_output_formats" AS ENUM('svg');
		CREATE TYPE "public"."enum_templates_output_formats" AS ENUM('png', 'tiff', 'pdf');
		CREATE TYPE "public"."enum__templates_v_version_output_formats" AS ENUM('png', 'tiff', 'pdf');

		CREATE TABLE "image_profiles_output_formats" (
			"order" integer NOT NULL,
			"parent_id" integer NOT NULL,
			"value" "enum_image_profiles_output_formats",
			"id" serial PRIMARY KEY NOT NULL
		);

		CREATE TABLE "_image_profiles_v_version_output_formats" (
			"order" integer NOT NULL,
			"parent_id" integer NOT NULL,
			"value" "enum__image_profiles_v_version_output_formats",
			"id" serial PRIMARY KEY NOT NULL
		);

		CREATE TABLE "graphic_profiles_output_formats" (
			"order" integer NOT NULL,
			"parent_id" integer NOT NULL,
			"value" "enum_graphic_profiles_output_formats",
			"id" serial PRIMARY KEY NOT NULL
		);

		CREATE TABLE "_graphic_profiles_v_version_output_formats" (
			"order" integer NOT NULL,
			"parent_id" integer NOT NULL,
			"value" "enum__graphic_profiles_v_version_output_formats",
			"id" serial PRIMARY KEY NOT NULL
		);

		CREATE TABLE "templates_output_formats" (
			"order" integer NOT NULL,
			"parent_id" integer NOT NULL,
			"value" "enum_templates_output_formats",
			"id" serial PRIMARY KEY NOT NULL
		);

		CREATE TABLE "_templates_v_version_output_formats" (
			"order" integer NOT NULL,
			"parent_id" integer NOT NULL,
			"value" "enum__templates_v_version_output_formats",
			"id" serial PRIMARY KEY NOT NULL
		);

		ALTER TABLE "image_profiles" ADD COLUMN "output_original" boolean DEFAULT true;
		ALTER TABLE "_image_profiles_v" ADD COLUMN "version_output_original" boolean DEFAULT true;

		ALTER TABLE "image_profiles_output_formats" ADD CONSTRAINT "image_profiles_output_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
		ALTER TABLE "_image_profiles_v_version_output_formats" ADD CONSTRAINT "_image_profiles_v_version_output_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
		ALTER TABLE "graphic_profiles_output_formats" ADD CONSTRAINT "graphic_profiles_output_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
		ALTER TABLE "_graphic_profiles_v_version_output_formats" ADD CONSTRAINT "_graphic_profiles_v_version_output_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
		ALTER TABLE "templates_output_formats" ADD CONSTRAINT "templates_output_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
		ALTER TABLE "_templates_v_version_output_formats" ADD CONSTRAINT "_templates_v_version_output_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;

		CREATE INDEX "image_profiles_output_formats_order_idx" ON "image_profiles_output_formats" USING btree ("order");
		CREATE INDEX "image_profiles_output_formats_parent_idx" ON "image_profiles_output_formats" USING btree ("parent_id");
		CREATE INDEX "_image_profiles_v_version_output_formats_order_idx" ON "_image_profiles_v_version_output_formats" USING btree ("order");
		CREATE INDEX "_image_profiles_v_version_output_formats_parent_idx" ON "_image_profiles_v_version_output_formats" USING btree ("parent_id");
		CREATE INDEX "graphic_profiles_output_formats_order_idx" ON "graphic_profiles_output_formats" USING btree ("order");
		CREATE INDEX "graphic_profiles_output_formats_parent_idx" ON "graphic_profiles_output_formats" USING btree ("parent_id");
		CREATE INDEX "_graphic_profiles_v_version_output_formats_order_idx" ON "_graphic_profiles_v_version_output_formats" USING btree ("order");
		CREATE INDEX "_graphic_profiles_v_version_output_formats_parent_idx" ON "_graphic_profiles_v_version_output_formats" USING btree ("parent_id");
		CREATE INDEX "templates_output_formats_order_idx" ON "templates_output_formats" USING btree ("order");
		CREATE INDEX "templates_output_formats_parent_idx" ON "templates_output_formats" USING btree ("parent_id");
		CREATE INDEX "_templates_v_version_output_formats_order_idx" ON "_templates_v_version_output_formats" USING btree ("order");
		CREATE INDEX "_templates_v_version_output_formats_parent_idx" ON "_templates_v_version_output_formats" USING btree ("parent_id");
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DROP TABLE "image_profiles_output_formats" CASCADE;
		DROP TABLE "_image_profiles_v_version_output_formats" CASCADE;
		DROP TABLE "graphic_profiles_output_formats" CASCADE;
		DROP TABLE "_graphic_profiles_v_version_output_formats" CASCADE;
		DROP TABLE "templates_output_formats" CASCADE;
		DROP TABLE "_templates_v_version_output_formats" CASCADE;

		ALTER TABLE "image_profiles" DROP COLUMN "output_original";
		ALTER TABLE "_image_profiles_v" DROP COLUMN "version_output_original";

		DROP TYPE "public"."enum_image_profiles_output_formats";
		DROP TYPE "public"."enum__image_profiles_v_version_output_formats";
		DROP TYPE "public"."enum_graphic_profiles_output_formats";
		DROP TYPE "public"."enum__graphic_profiles_v_version_output_formats";
		DROP TYPE "public"."enum_templates_output_formats";
		DROP TYPE "public"."enum__templates_v_version_output_formats";
	`)
}
