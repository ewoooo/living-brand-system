import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_example_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_example_columns" AS ENUM('2', '3', '4');
  ALTER TABLE "guideline_docs_blocks_do_dont" ADD COLUMN "example_columns" "enum_guideline_docs_blocks_do_dont_example_columns" DEFAULT '3';
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" ADD COLUMN "example_columns" "enum__guideline_docs_v_blocks_do_dont_example_columns" DEFAULT '3';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guideline_docs_blocks_do_dont" DROP COLUMN "example_columns";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" DROP COLUMN "example_columns";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_example_columns";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_example_columns";`)
}
