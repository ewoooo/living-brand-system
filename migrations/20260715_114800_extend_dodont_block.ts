import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// dev DB는 push 모드로 스키마가 먼저 반영될 수 있어 모든 단계를 멱등하게 작성한다.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "guideline_docs_blocks_do_dont_groups_locales" ADD COLUMN IF NOT EXISTS "description" varchar;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" ADD COLUMN IF NOT EXISTS "description" varchar;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio" AS ENUM('4:3', '1:1', '16:9');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_image_ratio" AS ENUM('4:3', '1:1', '16:9');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_group_layout" AS ENUM('vertical', 'horizontal');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_group_layout" AS ENUM('vertical', 'horizontal');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  ALTER TABLE "guideline_docs_blocks_do_dont" ADD COLUMN IF NOT EXISTS "image_ratio" "enum_guideline_docs_blocks_do_dont_image_ratio" DEFAULT '4:3';
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" ADD COLUMN IF NOT EXISTS "image_ratio" "enum__guideline_docs_v_blocks_do_dont_image_ratio" DEFAULT '4:3';
  ALTER TABLE "guideline_docs_blocks_do_dont" ADD COLUMN IF NOT EXISTS "group_layout" "enum_guideline_docs_blocks_do_dont_group_layout" DEFAULT 'vertical';
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" ADD COLUMN IF NOT EXISTS "group_layout" "enum__guideline_docs_v_blocks_do_dont_group_layout" DEFAULT 'vertical';
  DO $$ BEGIN
    CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_groups_kind" AS ENUM('do', 'ok', 'dont');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_groups_kind" AS ENUM('do', 'ok', 'dont');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups" ADD COLUMN IF NOT EXISTS "kind" "enum_guideline_docs_blocks_do_dont_groups_kind" DEFAULT 'dont';
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups" ADD COLUMN IF NOT EXISTS "kind" "enum__guideline_docs_v_blocks_do_dont_groups_kind" DEFAULT 'dont';
  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'guideline_docs_blocks_do_dont_groups_examples' AND column_name = 'kind'
    ) THEN
      UPDATE "guideline_docs_blocks_do_dont_groups" g SET "kind" = (
        SELECT e."kind"::text FROM "guideline_docs_blocks_do_dont_groups_examples" e
        WHERE e."_parent_id" = g."id" ORDER BY e."_order" LIMIT 1
      )::"public"."enum_guideline_docs_blocks_do_dont_groups_kind"
      WHERE EXISTS (
        SELECT 1 FROM "guideline_docs_blocks_do_dont_groups_examples" e WHERE e."_parent_id" = g."id"
      );
      ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples" DROP COLUMN "kind";
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = '_guideline_docs_v_blocks_do_dont_groups_examples' AND column_name = 'kind'
    ) THEN
      UPDATE "_guideline_docs_v_blocks_do_dont_groups" g SET "kind" = (
        SELECT e."kind"::text FROM "_guideline_docs_v_blocks_do_dont_groups_examples" e
        WHERE e."_parent_id" = g."id" ORDER BY e."_order" LIMIT 1
      )::"public"."enum__guideline_docs_v_blocks_do_dont_groups_kind"
      WHERE EXISTS (
        SELECT 1 FROM "_guideline_docs_v_blocks_do_dont_groups_examples" e WHERE e."_parent_id" = g."id"
      );
      ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" DROP COLUMN "kind";
    END IF;
  END $$;
  DROP TYPE IF EXISTS "public"."enum_guideline_docs_blocks_do_dont_groups_examples_kind";
  DROP TYPE IF EXISTS "public"."enum__guideline_docs_v_blocks_do_dont_groups_examples_kind";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
	// 예시 kind는 그룹 kind로 복원한다. 'ok'는 구 스키마에 없으므로 'do'로 낮춘다.
	await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_groups_examples_kind" AS ENUM('do', 'dont');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_groups_examples_kind" AS ENUM('do', 'dont');
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples" ADD COLUMN "kind" "enum_guideline_docs_blocks_do_dont_groups_examples_kind" DEFAULT 'dont';
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" ADD COLUMN "kind" "enum__guideline_docs_v_blocks_do_dont_groups_examples_kind" DEFAULT 'dont';
  UPDATE "guideline_docs_blocks_do_dont_groups_examples" e SET "kind" = (
    CASE WHEN g."kind" = 'dont' THEN 'dont' ELSE 'do' END
  )::"public"."enum_guideline_docs_blocks_do_dont_groups_examples_kind"
  FROM "guideline_docs_blocks_do_dont_groups" g WHERE e."_parent_id" = g."id";
  UPDATE "_guideline_docs_v_blocks_do_dont_groups_examples" e SET "kind" = (
    CASE WHEN g."kind" = 'dont' THEN 'dont' ELSE 'do' END
  )::"public"."enum__guideline_docs_v_blocks_do_dont_groups_examples_kind"
  FROM "_guideline_docs_v_blocks_do_dont_groups" g WHERE e."_parent_id" = g."id";
  ALTER TABLE "guideline_docs_blocks_do_dont_groups" DROP COLUMN "kind";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups" DROP COLUMN "kind";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_groups_kind";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_groups_kind";
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_locales" DROP COLUMN "description";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" DROP COLUMN "description";
  ALTER TABLE "guideline_docs_blocks_do_dont" DROP COLUMN "image_ratio";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" DROP COLUMN "image_ratio";
  ALTER TABLE "guideline_docs_blocks_do_dont" DROP COLUMN "group_layout";
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" DROP COLUMN "group_layout";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_image_ratio";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_group_layout";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_group_layout";`)
}
