import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rule_checkers" RENAME COLUMN "prompt_key" TO "prompt";
  ALTER TABLE "_rule_checkers_v" RENAME COLUMN "version_prompt_key" TO "version_prompt";
  ALTER TABLE "guideline_docs_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "_guideline_docs_v_version_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks" ALTER COLUMN "executor" DROP DEFAULT;
  ALTER TABLE "rule_checkers" ADD COLUMN "name" varchar;
  UPDATE "rule_checkers" SET "name" = "key" WHERE "name" IS NULL;
  ALTER TABLE "_rule_checkers_v" ADD COLUMN "version_name" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rule_checkers" RENAME COLUMN "prompt" TO "prompt_key";
  ALTER TABLE "_rule_checkers_v" RENAME COLUMN "version_prompt" TO "version_prompt_key";
  ALTER TABLE "guideline_docs_blocks_column_unit_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "guideline_docs_blocks_color_palette_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "guideline_docs_blocks_do_dont_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "guideline_docs_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "_guideline_docs_v_version_checks" ALTER COLUMN "executor" SET DEFAULT 'deterministic';
  ALTER TABLE "rule_checkers" DROP COLUMN "name";
  ALTER TABLE "_rule_checkers_v" DROP COLUMN "version_name";`)
}
