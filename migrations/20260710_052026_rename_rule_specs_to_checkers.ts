import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_rule_specs_executor" RENAME TO "enum_rule_checkers_executor";
  ALTER TYPE "public"."enum_rule_specs_status" RENAME TO "enum_rule_checkers_status";
  ALTER TYPE "public"."enum__rule_specs_v_version_executor" RENAME TO "enum__rule_checkers_v_version_executor";
  ALTER TYPE "public"."enum__rule_specs_v_version_status" RENAME TO "enum__rule_checkers_v_version_status";
  ALTER TYPE "public"."enum__rule_specs_v_published_locale" RENAME TO "enum__rule_checkers_v_published_locale";
  ALTER TABLE "rule_specs" RENAME TO "rule_checkers";
  ALTER TABLE "_rule_specs_v" RENAME TO "_rule_checkers_v";
  ALTER TABLE "rules" RENAME COLUMN "spec_id" TO "checker_id";
  ALTER TABLE "payload_locked_documents_rels" RENAME COLUMN "rule_specs_id" TO "rule_checkers_id";
  ALTER TABLE "_rule_checkers_v" DROP CONSTRAINT "_rule_specs_v_parent_id_rule_specs_id_fk";
  ALTER TABLE "rules" DROP CONSTRAINT "rules_spec_id_rule_specs_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rule_specs_fk";

  DROP INDEX "rule_specs_key_idx";
  DROP INDEX "rule_specs_updated_at_idx";
  DROP INDEX "rule_specs_created_at_idx";
  DROP INDEX "rule_specs__status_idx";
  DROP INDEX "_rule_specs_v_parent_idx";
  DROP INDEX "_rule_specs_v_version_version_key_idx";
  DROP INDEX "_rule_specs_v_version_version_updated_at_idx";
  DROP INDEX "_rule_specs_v_version_version_created_at_idx";
  DROP INDEX "_rule_specs_v_version_version__status_idx";
  DROP INDEX "_rule_specs_v_created_at_idx";
  DROP INDEX "_rule_specs_v_updated_at_idx";
  DROP INDEX "_rule_specs_v_snapshot_idx";
  DROP INDEX "_rule_specs_v_published_locale_idx";
  DROP INDEX "_rule_specs_v_latest_idx";
  DROP INDEX "rules_spec_idx";
  DROP INDEX "payload_locked_documents_rels_rule_specs_id_idx";
  ALTER TABLE "_rule_checkers_v" ADD CONSTRAINT "_rule_checkers_v_parent_id_rule_checkers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rules" ADD CONSTRAINT "rules_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rule_checkers_fk" FOREIGN KEY ("rule_checkers_id") REFERENCES "public"."rule_checkers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "rule_checkers_key_idx" ON "rule_checkers" USING btree ("key");
  CREATE INDEX "rule_checkers_updated_at_idx" ON "rule_checkers" USING btree ("updated_at");
  CREATE INDEX "rule_checkers_created_at_idx" ON "rule_checkers" USING btree ("created_at");
  CREATE INDEX "rule_checkers__status_idx" ON "rule_checkers" USING btree ("_status");
  CREATE INDEX "_rule_checkers_v_parent_idx" ON "_rule_checkers_v" USING btree ("parent_id");
  CREATE INDEX "_rule_checkers_v_version_version_key_idx" ON "_rule_checkers_v" USING btree ("version_key");
  CREATE INDEX "_rule_checkers_v_version_version_updated_at_idx" ON "_rule_checkers_v" USING btree ("version_updated_at");
  CREATE INDEX "_rule_checkers_v_version_version_created_at_idx" ON "_rule_checkers_v" USING btree ("version_created_at");
  CREATE INDEX "_rule_checkers_v_version_version__status_idx" ON "_rule_checkers_v" USING btree ("version__status");
  CREATE INDEX "_rule_checkers_v_created_at_idx" ON "_rule_checkers_v" USING btree ("created_at");
  CREATE INDEX "_rule_checkers_v_updated_at_idx" ON "_rule_checkers_v" USING btree ("updated_at");
  CREATE INDEX "_rule_checkers_v_snapshot_idx" ON "_rule_checkers_v" USING btree ("snapshot");
  CREATE INDEX "_rule_checkers_v_published_locale_idx" ON "_rule_checkers_v" USING btree ("published_locale");
  CREATE INDEX "_rule_checkers_v_latest_idx" ON "_rule_checkers_v" USING btree ("latest");
  CREATE INDEX "rules_checker_idx" ON "rules" USING btree ("checker_id");
  CREATE INDEX "payload_locked_documents_rels_rule_checkers_id_idx" ON "payload_locked_documents_rels" USING btree ("rule_checkers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_rule_checkers_executor" RENAME TO "enum_rule_specs_executor";
  ALTER TYPE "public"."enum_rule_checkers_status" RENAME TO "enum_rule_specs_status";
  ALTER TYPE "public"."enum__rule_checkers_v_version_executor" RENAME TO "enum__rule_specs_v_version_executor";
  ALTER TYPE "public"."enum__rule_checkers_v_version_status" RENAME TO "enum__rule_specs_v_version_status";
  ALTER TYPE "public"."enum__rule_checkers_v_published_locale" RENAME TO "enum__rule_specs_v_published_locale";
  ALTER TABLE "rule_checkers" RENAME TO "rule_specs";
  ALTER TABLE "_rule_checkers_v" RENAME TO "_rule_specs_v";
  ALTER TABLE "rules" RENAME COLUMN "checker_id" TO "spec_id";
  ALTER TABLE "payload_locked_documents_rels" RENAME COLUMN "rule_checkers_id" TO "rule_specs_id";
  ALTER TABLE "_rule_specs_v" DROP CONSTRAINT "_rule_checkers_v_parent_id_rule_checkers_id_fk";
  ALTER TABLE "rules" DROP CONSTRAINT "rules_checker_id_rule_checkers_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rule_checkers_fk";

  DROP INDEX "rule_checkers_key_idx";
  DROP INDEX "rule_checkers_updated_at_idx";
  DROP INDEX "rule_checkers_created_at_idx";
  DROP INDEX "rule_checkers__status_idx";
  DROP INDEX "_rule_checkers_v_parent_idx";
  DROP INDEX "_rule_checkers_v_version_version_key_idx";
  DROP INDEX "_rule_checkers_v_version_version_updated_at_idx";
  DROP INDEX "_rule_checkers_v_version_version_created_at_idx";
  DROP INDEX "_rule_checkers_v_version_version__status_idx";
  DROP INDEX "_rule_checkers_v_created_at_idx";
  DROP INDEX "_rule_checkers_v_updated_at_idx";
  DROP INDEX "_rule_checkers_v_snapshot_idx";
  DROP INDEX "_rule_checkers_v_published_locale_idx";
  DROP INDEX "_rule_checkers_v_latest_idx";
  DROP INDEX "rules_checker_idx";
  DROP INDEX "payload_locked_documents_rels_rule_checkers_id_idx";
  ALTER TABLE "_rule_specs_v" ADD CONSTRAINT "_rule_specs_v_parent_id_rule_specs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rule_specs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rules" ADD CONSTRAINT "rules_spec_id_rule_specs_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."rule_specs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rule_specs_fk" FOREIGN KEY ("rule_specs_id") REFERENCES "public"."rule_specs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "rule_specs_key_idx" ON "rule_specs" USING btree ("key");
  CREATE INDEX "rule_specs_updated_at_idx" ON "rule_specs" USING btree ("updated_at");
  CREATE INDEX "rule_specs_created_at_idx" ON "rule_specs" USING btree ("created_at");
  CREATE INDEX "rule_specs__status_idx" ON "rule_specs" USING btree ("_status");
  CREATE INDEX "_rule_specs_v_parent_idx" ON "_rule_specs_v" USING btree ("parent_id");
  CREATE INDEX "_rule_specs_v_version_version_key_idx" ON "_rule_specs_v" USING btree ("version_key");
  CREATE INDEX "_rule_specs_v_version_version_updated_at_idx" ON "_rule_specs_v" USING btree ("version_updated_at");
  CREATE INDEX "_rule_specs_v_version_version_created_at_idx" ON "_rule_specs_v" USING btree ("version_created_at");
  CREATE INDEX "_rule_specs_v_version_version__status_idx" ON "_rule_specs_v" USING btree ("version__status");
  CREATE INDEX "_rule_specs_v_created_at_idx" ON "_rule_specs_v" USING btree ("created_at");
  CREATE INDEX "_rule_specs_v_updated_at_idx" ON "_rule_specs_v" USING btree ("updated_at");
  CREATE INDEX "_rule_specs_v_snapshot_idx" ON "_rule_specs_v" USING btree ("snapshot");
  CREATE INDEX "_rule_specs_v_published_locale_idx" ON "_rule_specs_v" USING btree ("published_locale");
  CREATE INDEX "_rule_specs_v_latest_idx" ON "_rule_specs_v" USING btree ("latest");
  CREATE INDEX "rules_spec_idx" ON "rules" USING btree ("spec_id");
  CREATE INDEX "payload_locked_documents_rels_rule_specs_id_idx" ON "payload_locked_documents_rels" USING btree ("rule_specs_id");`)
}
