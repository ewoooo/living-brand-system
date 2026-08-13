import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_image_profiles_output_allowed_formats" RENAME TO "enum_image_profiles_export_policy_allowed_formats";
  ALTER TYPE "public"."enum__image_profiles_v_version_output_allowed_formats" RENAME TO "enum__image_profiles_v_version_export_policy_allowed_formats";
  ALTER TYPE "public"."enum_graphic_profiles_output_allowed_formats" RENAME TO "enum_graphic_profiles_export_policy_allowed_formats";
  ALTER TYPE "public"."enum__graphic_profiles_v_version_output_allowed_formats" RENAME TO "enum__graphic_profiles_v_version_export_policy_allowed_formats";
  ALTER TYPE "public"."enum_templates_output_allowed_formats" RENAME TO "enum_templates_export_policy_allowed_formats";
  ALTER TYPE "public"."enum__templates_v_version_output_allowed_formats" RENAME TO "enum__templates_v_version_export_policy_allowed_formats";
  ALTER TABLE "image_profiles_output_allowed_formats" RENAME TO "image_profiles_export_policy_allowed_formats";
  ALTER TABLE "_image_profiles_v_version_output_allowed_formats" RENAME TO "_image_profiles_v_version_export_policy_allowed_formats";
  ALTER TABLE "graphic_profiles_output_allowed_formats" RENAME TO "graphic_profiles_export_policy_allowed_formats";
  ALTER TABLE "_graphic_profiles_v_version_output_allowed_formats" RENAME TO "_graphic_profiles_v_version_export_policy_allowed_formats";
  ALTER TABLE "templates_output_allowed_formats" RENAME TO "templates_export_policy_allowed_formats";
  ALTER TABLE "_templates_v_version_output_allowed_formats" RENAME TO "_templates_v_version_export_policy_allowed_formats";
  ALTER TABLE "image_profiles" RENAME COLUMN "output_original" TO "export_policy_original";
  ALTER TABLE "_image_profiles_v" RENAME COLUMN "version_output_original" TO "version_export_policy_original";
  ALTER TABLE "image_profiles_export_policy_allowed_formats" DROP CONSTRAINT "image_profiles_output_allowed_formats_parent_fk";

  ALTER TABLE "_image_profiles_v_version_export_policy_allowed_formats" DROP CONSTRAINT "_image_profiles_v_version_output_allowed_formats_parent_fk";

  ALTER TABLE "graphic_profiles_export_policy_allowed_formats" DROP CONSTRAINT "graphic_profiles_output_allowed_formats_parent_fk";

  ALTER TABLE "_graphic_profiles_v_version_export_policy_allowed_formats" DROP CONSTRAINT "_graphic_profiles_v_version_output_allowed_formats_parent_fk";

  ALTER TABLE "templates_export_policy_allowed_formats" DROP CONSTRAINT "templates_output_allowed_formats_parent_fk";

  ALTER TABLE "_templates_v_version_export_policy_allowed_formats" DROP CONSTRAINT "_templates_v_version_output_allowed_formats_parent_fk";

  DROP INDEX "image_profiles_output_allowed_formats_order_idx";
  DROP INDEX "image_profiles_output_allowed_formats_parent_idx";
  DROP INDEX "_image_profiles_v_version_output_allowed_formats_order_idx";
  DROP INDEX "_image_profiles_v_version_output_allowed_formats_parent_idx";
  DROP INDEX "graphic_profiles_output_allowed_formats_order_idx";
  DROP INDEX "graphic_profiles_output_allowed_formats_parent_idx";
  DROP INDEX "_graphic_profiles_v_version_output_allowed_formats_order_idx";
  DROP INDEX "_graphic_profiles_v_version_output_allowed_formats_parent_idx";
  DROP INDEX "templates_output_allowed_formats_order_idx";
  DROP INDEX "templates_output_allowed_formats_parent_idx";
  DROP INDEX "_templates_v_version_output_allowed_formats_order_idx";
  DROP INDEX "_templates_v_version_output_allowed_formats_parent_idx";
  ALTER TABLE "image_profiles_export_policy_allowed_formats" ADD CONSTRAINT "image_profiles_export_policy_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_version_export_policy_allowed_formats" ADD CONSTRAINT "_image_profiles_v_version_export_policy_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_export_policy_allowed_formats" ADD CONSTRAINT "graphic_profiles_export_policy_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_version_export_policy_allowed_formats" ADD CONSTRAINT "_graphic_profiles_v_version_export_policy_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_export_policy_allowed_formats" ADD CONSTRAINT "templates_export_policy_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_export_policy_allowed_formats" ADD CONSTRAINT "_templates_v_version_export_policy_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "image_profiles_export_policy_allowed_formats_order_idx" ON "image_profiles_export_policy_allowed_formats" USING btree ("order");
  CREATE INDEX "image_profiles_export_policy_allowed_formats_parent_idx" ON "image_profiles_export_policy_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "_image_profiles_v_version_export_policy_allowed_formats_order_idx" ON "_image_profiles_v_version_export_policy_allowed_formats" USING btree ("order");
  CREATE INDEX "_image_profiles_v_version_export_policy_allowed_formats_parent_idx" ON "_image_profiles_v_version_export_policy_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "graphic_profiles_export_policy_allowed_formats_order_idx" ON "graphic_profiles_export_policy_allowed_formats" USING btree ("order");
  CREATE INDEX "graphic_profiles_export_policy_allowed_formats_parent_idx" ON "graphic_profiles_export_policy_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "_graphic_profiles_v_version_export_policy_allowed_formats_order_idx" ON "_graphic_profiles_v_version_export_policy_allowed_formats" USING btree ("order");
  CREATE INDEX "_graphic_profiles_v_version_export_policy_allowed_formats_parent_idx" ON "_graphic_profiles_v_version_export_policy_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "templates_export_policy_allowed_formats_order_idx" ON "templates_export_policy_allowed_formats" USING btree ("order");
  CREATE INDEX "templates_export_policy_allowed_formats_parent_idx" ON "templates_export_policy_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "_templates_v_version_export_policy_allowed_formats_order_idx" ON "_templates_v_version_export_policy_allowed_formats" USING btree ("order");
  CREATE INDEX "_templates_v_version_export_policy_allowed_formats_parent_idx" ON "_templates_v_version_export_policy_allowed_formats" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_image_profiles_export_policy_allowed_formats" RENAME TO "enum_image_profiles_output_allowed_formats";
  ALTER TYPE "public"."enum__image_profiles_v_version_export_policy_allowed_formats" RENAME TO "enum__image_profiles_v_version_output_allowed_formats";
  ALTER TYPE "public"."enum_graphic_profiles_export_policy_allowed_formats" RENAME TO "enum_graphic_profiles_output_allowed_formats";
  ALTER TYPE "public"."enum__graphic_profiles_v_version_export_policy_allowed_formats" RENAME TO "enum__graphic_profiles_v_version_output_allowed_formats";
  ALTER TYPE "public"."enum_templates_export_policy_allowed_formats" RENAME TO "enum_templates_output_allowed_formats";
  ALTER TYPE "public"."enum__templates_v_version_export_policy_allowed_formats" RENAME TO "enum__templates_v_version_output_allowed_formats";
  ALTER TABLE "image_profiles_export_policy_allowed_formats" RENAME TO "image_profiles_output_allowed_formats";
  ALTER TABLE "_image_profiles_v_version_export_policy_allowed_formats" RENAME TO "_image_profiles_v_version_output_allowed_formats";
  ALTER TABLE "graphic_profiles_export_policy_allowed_formats" RENAME TO "graphic_profiles_output_allowed_formats";
  ALTER TABLE "_graphic_profiles_v_version_export_policy_allowed_formats" RENAME TO "_graphic_profiles_v_version_output_allowed_formats";
  ALTER TABLE "templates_export_policy_allowed_formats" RENAME TO "templates_output_allowed_formats";
  ALTER TABLE "_templates_v_version_export_policy_allowed_formats" RENAME TO "_templates_v_version_output_allowed_formats";
  ALTER TABLE "image_profiles" RENAME COLUMN "export_policy_original" TO "output_original";
  ALTER TABLE "_image_profiles_v" RENAME COLUMN "version_export_policy_original" TO "version_output_original";
  ALTER TABLE "image_profiles_output_allowed_formats" DROP CONSTRAINT "image_profiles_export_policy_allowed_formats_parent_fk";

  ALTER TABLE "_image_profiles_v_version_output_allowed_formats" DROP CONSTRAINT "_image_profiles_v_version_export_policy_allowed_formats_parent_fk";

  ALTER TABLE "graphic_profiles_output_allowed_formats" DROP CONSTRAINT "graphic_profiles_export_policy_allowed_formats_parent_fk";

  ALTER TABLE "_graphic_profiles_v_version_output_allowed_formats" DROP CONSTRAINT "_graphic_profiles_v_version_export_policy_allowed_formats_parent_fk";

  ALTER TABLE "templates_output_allowed_formats" DROP CONSTRAINT "templates_export_policy_allowed_formats_parent_fk";

  ALTER TABLE "_templates_v_version_output_allowed_formats" DROP CONSTRAINT "_templates_v_version_export_policy_allowed_formats_parent_fk";

  DROP INDEX "image_profiles_export_policy_allowed_formats_order_idx";
  DROP INDEX "image_profiles_export_policy_allowed_formats_parent_idx";
  DROP INDEX "_image_profiles_v_version_export_policy_allowed_formats_order_idx";
  DROP INDEX "_image_profiles_v_version_export_policy_allowed_formats_parent_idx";
  DROP INDEX "graphic_profiles_export_policy_allowed_formats_order_idx";
  DROP INDEX "graphic_profiles_export_policy_allowed_formats_parent_idx";
  DROP INDEX "_graphic_profiles_v_version_export_policy_allowed_formats_order_idx";
  DROP INDEX "_graphic_profiles_v_version_export_policy_allowed_formats_parent_idx";
  DROP INDEX "templates_export_policy_allowed_formats_order_idx";
  DROP INDEX "templates_export_policy_allowed_formats_parent_idx";
  DROP INDEX "_templates_v_version_export_policy_allowed_formats_order_idx";
  DROP INDEX "_templates_v_version_export_policy_allowed_formats_parent_idx";
  ALTER TABLE "image_profiles_output_allowed_formats" ADD CONSTRAINT "image_profiles_output_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."image_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_image_profiles_v_version_output_allowed_formats" ADD CONSTRAINT "_image_profiles_v_version_output_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_image_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "graphic_profiles_output_allowed_formats" ADD CONSTRAINT "graphic_profiles_output_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."graphic_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_graphic_profiles_v_version_output_allowed_formats" ADD CONSTRAINT "_graphic_profiles_v_version_output_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_graphic_profiles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_output_allowed_formats" ADD CONSTRAINT "templates_output_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_output_allowed_formats" ADD CONSTRAINT "_templates_v_version_output_allowed_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "image_profiles_output_allowed_formats_order_idx" ON "image_profiles_output_allowed_formats" USING btree ("order");
  CREATE INDEX "image_profiles_output_allowed_formats_parent_idx" ON "image_profiles_output_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "_image_profiles_v_version_output_allowed_formats_order_idx" ON "_image_profiles_v_version_output_allowed_formats" USING btree ("order");
  CREATE INDEX "_image_profiles_v_version_output_allowed_formats_parent_idx" ON "_image_profiles_v_version_output_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "graphic_profiles_output_allowed_formats_order_idx" ON "graphic_profiles_output_allowed_formats" USING btree ("order");
  CREATE INDEX "graphic_profiles_output_allowed_formats_parent_idx" ON "graphic_profiles_output_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "_graphic_profiles_v_version_output_allowed_formats_order_idx" ON "_graphic_profiles_v_version_output_allowed_formats" USING btree ("order");
  CREATE INDEX "_graphic_profiles_v_version_output_allowed_formats_parent_idx" ON "_graphic_profiles_v_version_output_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "templates_output_allowed_formats_order_idx" ON "templates_output_allowed_formats" USING btree ("order");
  CREATE INDEX "templates_output_allowed_formats_parent_idx" ON "templates_output_allowed_formats" USING btree ("parent_id");
  CREATE INDEX "_templates_v_version_output_allowed_formats_order_idx" ON "_templates_v_version_output_allowed_formats" USING btree ("order");
  CREATE INDEX "_templates_v_version_output_allowed_formats_parent_idx" ON "_templates_v_version_output_allowed_formats" USING btree ("parent_id");`)
}
