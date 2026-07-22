import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	// 1단계(expand): rules 컬렉션 스키마와 관계 컬럼을 만든다.
	await db.execute(sql`
   CREATE TYPE "public"."enum_rules_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_rules_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_rules_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__rules_v_version_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__rules_v_version_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__rules_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__rules_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "rules_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar
  );
  
  CREATE TABLE "rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum_rules_tier",
  	"executor" "enum_rules_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_rules_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_rules_v_version_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rules_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_title_ko" varchar,
  	"version_key" varchar,
  	"version_tier" "enum__rules_v_version_tier",
  	"version_executor" "enum__rules_v_version_executor",
  	"version_checker_id" integer,
  	"version_options" jsonb,
  	"version_heuristic_prompt" varchar,
  	"version_messages_pass" varchar,
  	"version_messages_ok" varchar,
  	"version_messages_needs_review" varchar,
  	"version_messages_fail" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__rules_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__rules_v_published_locale",
  	"latest" boolean
  );
  ALTER TABLE "guideline_docs_rels" ADD COLUMN IF NOT EXISTS "rules_id" integer;
  ALTER TABLE "_guideline_docs_v_rels" ADD COLUMN IF NOT EXISTS "rules_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rules_id" integer;
  ALTER TABLE "rules_criteria" ADD CONSTRAINT "rules_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rules" ADD CONSTRAINT "rules_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rules_v_version_criteria" ADD CONSTRAINT "_rules_v_version_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rules_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rules_v" ADD CONSTRAINT "_rules_v_parent_id_rules_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rules_v" ADD CONSTRAINT "_rules_v_version_checker_id_rule_checkers_id_fk" FOREIGN KEY ("version_checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "rules_criteria_order_idx" ON "rules_criteria" USING btree ("_order");
  CREATE INDEX "rules_criteria_parent_id_idx" ON "rules_criteria" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "rules_key_idx" ON "rules" USING btree ("key");
  CREATE INDEX "rules_checker_idx" ON "rules" USING btree ("checker_id");
  CREATE INDEX "rules_updated_at_idx" ON "rules" USING btree ("updated_at");
  CREATE INDEX "rules_created_at_idx" ON "rules" USING btree ("created_at");
  CREATE INDEX "rules__status_idx" ON "rules" USING btree ("_status");
  CREATE INDEX "_rules_v_version_criteria_order_idx" ON "_rules_v_version_criteria" USING btree ("_order");
  CREATE INDEX "_rules_v_version_criteria_parent_id_idx" ON "_rules_v_version_criteria" USING btree ("_parent_id");
  CREATE INDEX "_rules_v_parent_idx" ON "_rules_v" USING btree ("parent_id");
  CREATE INDEX "_rules_v_version_version_key_idx" ON "_rules_v" USING btree ("version_key");
  CREATE INDEX "_rules_v_version_version_checker_idx" ON "_rules_v" USING btree ("version_checker_id");
  CREATE INDEX "_rules_v_version_version_updated_at_idx" ON "_rules_v" USING btree ("version_updated_at");
  CREATE INDEX "_rules_v_version_version_created_at_idx" ON "_rules_v" USING btree ("version_created_at");
  CREATE INDEX "_rules_v_version_version__status_idx" ON "_rules_v" USING btree ("version__status");
  CREATE INDEX "_rules_v_created_at_idx" ON "_rules_v" USING btree ("created_at");
  CREATE INDEX "_rules_v_updated_at_idx" ON "_rules_v" USING btree ("updated_at");
  CREATE INDEX "_rules_v_snapshot_idx" ON "_rules_v" USING btree ("snapshot");
  CREATE INDEX "_rules_v_published_locale_idx" ON "_rules_v" USING btree ("published_locale");
  CREATE INDEX "_rules_v_latest_idx" ON "_rules_v" USING btree ("latest");
  ALTER TABLE "guideline_docs_rels" ADD CONSTRAINT "guideline_docs_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_rels" ADD CONSTRAINT "_guideline_docs_v_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_rels_rules_id_idx" ON "guideline_docs_rels" USING btree ("rules_id");
  CREATE INDEX "_guideline_docs_v_rels_rules_id_idx" ON "_guideline_docs_v_rels" USING btree ("rules_id");
  CREATE INDEX "payload_locked_documents_rels_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("rules_id");`)

	// --- 데이터 이관: 임베디드 Check → rules 문서 + 관계 backfill ---
	// 스키마 diff가 checks 테이블을 DROP하기 전에 실행되도록 up()을 3단계로 나눴다.
	// fresh DB에는 checks 데이터가 없어 모든 단계가 no-op으로 통과한다.

	// 안전망: 기존 훅이 전역 유일성을 보장했지만, 위반 데이터가 있으면 자동 병합 대신 중단한다.
	// (자동 리네임은 CheckScenario.checkKeys와 CheckSession.rulesetSnapshot의 key 참조를 깨뜨린다.)
	const { rows: duplicateKeys } = await db.execute(sql`
		SELECT "key" FROM (
			SELECT "key" FROM "guideline_docs_checks"
			UNION ALL SELECT "key" FROM "guideline_docs_blocks_column_unit_checks"
			UNION ALL SELECT "key" FROM "guideline_docs_blocks_media_showcase_checks"
			UNION ALL SELECT "key" FROM "guideline_docs_blocks_color_palette_checks"
			UNION ALL SELECT "key" FROM "guideline_docs_blocks_do_dont_checks"
		) AS "check_keys"
		GROUP BY "key" HAVING COUNT(*) > 1
	`)
	if (duplicateKeys.length > 0) {
		const keys = duplicateKeys.map((row) => String(row.key)).join(', ')
		throw new Error(`중복 Check key가 있어 rules 이관을 중단합니다. 수동 정리 후 재실행하세요: ${keys}`)
	}

	// 발행/미발행 상태와 무관하게 main 테이블의 Check 정의를 published rule로 이관한다.
	// autosave draft 버전에만 존재하는 Check 정의는 이관하지 않는다(관계 backfill에서 key 미존재 시 skip).
	const checksTables = [
		{ checks: 'guideline_docs_checks', block: null },
		{ checks: 'guideline_docs_blocks_column_unit_checks', block: 'guideline_docs_blocks_column_unit' },
		{ checks: 'guideline_docs_blocks_media_showcase_checks', block: 'guideline_docs_blocks_media_showcase' },
		{ checks: 'guideline_docs_blocks_color_palette_checks', block: 'guideline_docs_blocks_color_palette' },
		{ checks: 'guideline_docs_blocks_do_dont_checks', block: 'guideline_docs_blocks_do_dont' },
	] as const

	for (const { checks } of checksTables) {
		await db.execute(sql`
			INSERT INTO "rules" (
				"title", "title_ko", "key", "tier", "executor", "checker_id", "options",
				"heuristic_prompt", "messages_pass", "messages_ok", "messages_needs_review",
				"messages_fail", "_status", "created_at", "updated_at"
			)
			SELECT
				c."title", c."title_ko", c."key",
				c."tier"::text::"public"."enum_rules_tier",
				c."executor"::text::"public"."enum_rules_executor",
				c."checker_id", c."options", c."heuristic_prompt", c."messages_pass",
				c."messages_ok", c."messages_needs_review", c."messages_fail",
				'published', NOW(), NOW()
			FROM ${sql.raw(`"${checks}"`)} c
		`)
		// criteria row의 varchar id는 CheckSession.rulesetSnapshot이 참조하므로 보존한다.
		await db.execute(sql`
			INSERT INTO "rules_criteria" (
				"_order", "_parent_id", "id", "question", "kind", "expected",
				"operator", "expected_value", "max", "unit"
			)
			SELECT
				cr."_order", r."id", cr."id", cr."question", cr."kind", cr."expected",
				cr."operator", cr."expected_value", cr."max", cr."unit"
			FROM ${sql.raw(`"${checks}_criteria"`)} cr
			JOIN ${sql.raw(`"${checks}"`)} c ON cr."_parent_id" = c."id"
			JOIN "rules" r ON r."key" = c."key"
		`)
	}

	// 관계 backfill — main 테이블. 블록 path는 'blocks.{_order-1}.rules' (0-based, 어댑터 규약 실측 확인).
	await db.execute(sql`
		INSERT INTO "guideline_docs_rels" ("order", "parent_id", "path", "rules_id")
		SELECT c."_order", c."_parent_id", 'rules', r."id"
		FROM "guideline_docs_checks" c
		JOIN "rules" r ON r."key" = c."key"
	`)
	for (const { checks, block } of checksTables) {
		if (!block) continue
		await db.execute(sql`
			INSERT INTO "guideline_docs_rels" ("order", "parent_id", "path", "rules_id")
			SELECT c."_order", b."_parent_id", 'blocks.' || (b."_order" - 1)::text || '.rules', r."id"
			FROM ${sql.raw(`"${checks}"`)} c
			JOIN ${sql.raw(`"${block}"`)} b ON c."_parent_id" = b."id"
			JOIN "rules" r ON r."key" = c."key"
		`)
	}

	// 관계 backfill — 버전 테이블. 누락 시 autosave draft 재발행에서 rules 선택이 유실된다.
	// 옛 버전에만 존재하는 key는 rules에 없으므로 JOIN에서 자연히 제외된다.
	await db.execute(sql`
		INSERT INTO "_guideline_docs_v_rels" ("order", "parent_id", "path", "rules_id")
		SELECT vc."_order", vc."_parent_id", 'version.rules', r."id"
		FROM "_guideline_docs_v_version_checks" vc
		JOIN "rules" r ON r."key" = vc."key"
	`)
	const versionBlockTables = [
		'_guideline_docs_v_blocks_column_unit',
		'_guideline_docs_v_blocks_media_showcase',
		'_guideline_docs_v_blocks_color_palette',
		'_guideline_docs_v_blocks_do_dont',
	] as const
	for (const versionBlock of versionBlockTables) {
		await db.execute(sql`
			INSERT INTO "_guideline_docs_v_rels" ("order", "parent_id", "path", "rules_id")
			SELECT vc."_order", vb."_parent_id", 'version.blocks.' || (vb."_order" - 1)::text || '.rules', r."id"
			FROM ${sql.raw(`"${versionBlock}_checks"`)} vc
			JOIN ${sql.raw(`"${versionBlock}"`)} vb ON vc."_parent_id" = vb."id"
			JOIN "rules" r ON r."key" = vc."key"
		`)
	}

	// --- 계약(contract): 임베디드 checks 테이블과 전용 enum 제거 ---
	await db.execute(sql`
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_version_checks" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_docs_blocks_column_unit_checks_criteria" CASCADE;
  DROP TABLE "guideline_docs_blocks_column_unit_checks" CASCADE;
  DROP TABLE "guideline_docs_blocks_media_showcase_checks_criteria" CASCADE;
  DROP TABLE "guideline_docs_blocks_media_showcase_checks" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_palette_checks_criteria" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_palette_checks" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_checks_criteria" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_checks" CASCADE;
  DROP TABLE "guideline_docs_checks_criteria" CASCADE;
  DROP TABLE "guideline_docs_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_column_unit_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_media_showcase_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_palette_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_checks" CASCADE;
  DROP TABLE "_guideline_docs_v_version_checks_criteria" CASCADE;
  DROP TABLE "_guideline_docs_v_version_checks" CASCADE;
  DROP TYPE "public"."enum_guideline_docs_blocks_column_unit_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_blocks_column_unit_checks_executor";
  DROP TYPE "public"."enum_guideline_docs_blocks_media_showcase_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_blocks_media_showcase_checks_executor";
  DROP TYPE "public"."enum_guideline_docs_blocks_color_palette_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_blocks_color_palette_checks_executor";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_checks_executor";
  DROP TYPE "public"."enum_guideline_docs_checks_tier";
  DROP TYPE "public"."enum_guideline_docs_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_column_unit_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_column_unit_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_color_palette_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_color_palette_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_checks_executor";
  DROP TYPE "public"."enum__guideline_docs_v_version_checks_tier";
  DROP TYPE "public"."enum__guideline_docs_v_version_checks_executor";`)
}

// down은 스키마만 역연산한다. rules로 이관된 Check 데이터는 복원하지 않는다.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_blocks_column_unit_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_blocks_column_unit_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_docs_blocks_media_showcase_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_blocks_media_showcase_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_docs_blocks_color_palette_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_blocks_color_palette_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum_guideline_docs_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum_guideline_docs_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_column_unit_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_column_unit_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_color_palette_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_color_palette_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TYPE "public"."enum__guideline_docs_v_version_checks_tier" AS ENUM('required', 'recommended');
  CREATE TYPE "public"."enum__guideline_docs_v_version_checks_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  CREATE TABLE "guideline_docs_blocks_column_unit_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_column_unit_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum_guideline_docs_blocks_column_unit_checks_tier",
  	"executor" "enum_guideline_docs_blocks_column_unit_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_media_showcase_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_media_showcase_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum_guideline_docs_blocks_media_showcase_checks_tier",
  	"executor" "enum_guideline_docs_blocks_media_showcase_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_color_palette_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_color_palette_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum_guideline_docs_blocks_color_palette_checks_tier",
  	"executor" "enum_guideline_docs_blocks_color_palette_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_do_dont_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_do_dont_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum_guideline_docs_blocks_do_dont_checks_tier",
  	"executor" "enum_guideline_docs_blocks_do_dont_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "guideline_docs_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar
  );
  
  CREATE TABLE "guideline_docs_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum_guideline_docs_checks_tier",
  	"executor" "enum_guideline_docs_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_column_unit_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum__guideline_docs_v_blocks_column_unit_checks_tier",
  	"executor" "enum__guideline_docs_v_blocks_column_unit_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_media_showcase_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum__guideline_docs_v_blocks_media_showcase_checks_tier",
  	"executor" "enum__guideline_docs_v_blocks_media_showcase_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_palette_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum__guideline_docs_v_blocks_color_palette_checks_tier",
  	"executor" "enum__guideline_docs_v_blocks_color_palette_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_do_dont_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum__guideline_docs_v_blocks_do_dont_checks_tier",
  	"executor" "enum__guideline_docs_v_blocks_do_dont_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_version_checks_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"kind" "enum_heuristic_criterion_kind" DEFAULT 'presence',
  	"expected" "enum_heuristic_criterion_expected",
  	"operator" "enum_heuristic_criterion_operator",
  	"expected_value" numeric,
  	"max" numeric,
  	"unit" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_version_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"title_ko" varchar,
  	"key" varchar,
  	"tier" "enum__guideline_docs_v_version_checks_tier",
  	"executor" "enum__guideline_docs_v_version_checks_executor",
  	"checker_id" integer,
  	"options" jsonb,
  	"heuristic_prompt" varchar,
  	"messages_pass" varchar,
  	"messages_ok" varchar,
  	"messages_needs_review" varchar,
  	"messages_fail" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "rules_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rules_v_version_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rules_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rules_criteria" CASCADE;
  DROP TABLE "rules" CASCADE;
  DROP TABLE "_rules_v_version_criteria" CASCADE;
  DROP TABLE "_rules_v" CASCADE;
  ALTER TABLE "guideline_docs_rels" DROP CONSTRAINT "guideline_docs_rels_rules_fk";
  
  ALTER TABLE "_guideline_docs_v_rels" DROP CONSTRAINT "_guideline_docs_v_rels_rules_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rules_fk";
  
  DROP INDEX "guideline_docs_rels_rules_id_idx";
  DROP INDEX "_guideline_docs_v_rels_rules_id_idx";
  DROP INDEX "payload_locked_documents_rels_rules_id_idx";
  ALTER TABLE "guideline_docs_blocks_column_unit_checks_criteria" ADD CONSTRAINT "guideline_docs_blocks_column_unit_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_column_unit_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks" ADD CONSTRAINT "guideline_docs_blocks_column_unit_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_column_unit_checks" ADD CONSTRAINT "guideline_docs_blocks_column_unit_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks_criteria" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_media_showcase_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_checks" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks_criteria" ADD CONSTRAINT "guideline_docs_blocks_color_palette_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_color_palette_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks" ADD CONSTRAINT "guideline_docs_blocks_color_palette_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_palette_checks" ADD CONSTRAINT "guideline_docs_blocks_color_palette_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks_criteria" ADD CONSTRAINT "guideline_docs_blocks_do_dont_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks" ADD CONSTRAINT "guideline_docs_blocks_do_dont_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_checks" ADD CONSTRAINT "guideline_docs_blocks_do_dont_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_checks_criteria" ADD CONSTRAINT "guideline_docs_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_checks" ADD CONSTRAINT "guideline_docs_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_checks" ADD CONSTRAINT "guideline_docs_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_column_unit_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_column_unit_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_column_unit_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_column_unit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_media_showcase_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_color_palette_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_checks" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_version_checks_criteria" ADD CONSTRAINT "_guideline_docs_v_version_checks_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_version_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_version_checks" ADD CONSTRAINT "_guideline_docs_v_version_checks_checker_id_rule_checkers_id_fk" FOREIGN KEY ("checker_id") REFERENCES "public"."rule_checkers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_version_checks" ADD CONSTRAINT "_guideline_docs_v_version_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_column_unit_checks_criteria_order_idx" ON "guideline_docs_blocks_column_unit_checks_criteria" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_column_unit_checks_criteria_parent_id_idx" ON "guideline_docs_blocks_column_unit_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_checks_order_idx" ON "guideline_docs_blocks_column_unit_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_column_unit_checks_parent_id_idx" ON "guideline_docs_blocks_column_unit_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_column_unit_checks_checker_idx" ON "guideline_docs_blocks_column_unit_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_checks_criteria_order_idx" ON "guideline_docs_blocks_media_showcase_checks_criteria" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_media_showcase_checks_criteria_parent_id_idx" ON "guideline_docs_blocks_media_showcase_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_checks_order_idx" ON "guideline_docs_blocks_media_showcase_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_media_showcase_checks_parent_id_idx" ON "guideline_docs_blocks_media_showcase_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_checks_checker_idx" ON "guideline_docs_blocks_media_showcase_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_docs_blocks_color_palette_checks_criteria_order_idx" ON "guideline_docs_blocks_color_palette_checks_criteria" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_color_palette_checks_criteria_parent_id_idx" ON "guideline_docs_blocks_color_palette_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_color_palette_checks_order_idx" ON "guideline_docs_blocks_color_palette_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_color_palette_checks_parent_id_idx" ON "guideline_docs_blocks_color_palette_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_color_palette_checks_checker_idx" ON "guideline_docs_blocks_color_palette_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_checks_criteria_order_idx" ON "guideline_docs_blocks_do_dont_checks_criteria" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_do_dont_checks_criteria_parent_id_idx" ON "guideline_docs_blocks_do_dont_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_checks_order_idx" ON "guideline_docs_blocks_do_dont_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_do_dont_checks_parent_id_idx" ON "guideline_docs_blocks_do_dont_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_checks_checker_idx" ON "guideline_docs_blocks_do_dont_checks" USING btree ("checker_id");
  CREATE INDEX "guideline_docs_checks_criteria_order_idx" ON "guideline_docs_checks_criteria" USING btree ("_order");
  CREATE INDEX "guideline_docs_checks_criteria_parent_id_idx" ON "guideline_docs_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_checks_order_idx" ON "guideline_docs_checks" USING btree ("_order");
  CREATE INDEX "guideline_docs_checks_parent_id_idx" ON "guideline_docs_checks" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_checks_checker_idx" ON "guideline_docs_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_checks_criteria_order_idx" ON "_guideline_docs_v_blocks_column_unit_checks_criteria" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_checks_criteria_parent_id_idx" ON "_guideline_docs_v_blocks_column_unit_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_checks_order_idx" ON "_guideline_docs_v_blocks_column_unit_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_checks_parent_id_idx" ON "_guideline_docs_v_blocks_column_unit_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_column_unit_checks_checker_idx" ON "_guideline_docs_v_blocks_column_unit_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_checks_criteria_order_idx" ON "_guideline_docs_v_blocks_media_showcase_checks_criteria" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_checks_criteria_parent_id_idx" ON "_guideline_docs_v_blocks_media_showcase_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_checks_order_idx" ON "_guideline_docs_v_blocks_media_showcase_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_checks_parent_id_idx" ON "_guideline_docs_v_blocks_media_showcase_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_checks_checker_idx" ON "_guideline_docs_v_blocks_media_showcase_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_checks_criteria_order_idx" ON "_guideline_docs_v_blocks_color_palette_checks_criteria" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_checks_criteria_parent_id_idx" ON "_guideline_docs_v_blocks_color_palette_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_checks_order_idx" ON "_guideline_docs_v_blocks_color_palette_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_checks_parent_id_idx" ON "_guideline_docs_v_blocks_color_palette_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_checks_checker_idx" ON "_guideline_docs_v_blocks_color_palette_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_checks_criteria_order_idx" ON "_guideline_docs_v_blocks_do_dont_checks_criteria" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_checks_criteria_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_checks_order_idx" ON "_guideline_docs_v_blocks_do_dont_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_checks_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_checks_checker_idx" ON "_guideline_docs_v_blocks_do_dont_checks" USING btree ("checker_id");
  CREATE INDEX "_guideline_docs_v_version_checks_criteria_order_idx" ON "_guideline_docs_v_version_checks_criteria" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_version_checks_criteria_parent_id_idx" ON "_guideline_docs_v_version_checks_criteria" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_version_checks_order_idx" ON "_guideline_docs_v_version_checks" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_version_checks_parent_id_idx" ON "_guideline_docs_v_version_checks" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_version_checks_checker_idx" ON "_guideline_docs_v_version_checks" USING btree ("checker_id");
  ALTER TABLE "guideline_docs_rels" DROP COLUMN "rules_id";
  ALTER TABLE "_guideline_docs_v_rels" DROP COLUMN "rules_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rules_id";
  DROP TYPE "public"."enum_rules_tier";
  DROP TYPE "public"."enum_rules_executor";
  DROP TYPE "public"."enum_rules_status";
  DROP TYPE "public"."enum__rules_v_version_tier";
  DROP TYPE "public"."enum__rules_v_version_executor";
  DROP TYPE "public"."enum__rules_v_version_status";
  DROP TYPE "public"."enum__rules_v_published_locale";`)
}
