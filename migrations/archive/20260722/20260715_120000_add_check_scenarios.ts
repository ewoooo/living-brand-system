import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const CHECK_SCENARIOS = [
	{
		key: 'quick',
		title: '빠른 기본 검수',
		checkKeys: [
			'color.palette',
			'color.combination',
			'color.contrast',
			'logo.size.minimum',
			'logo.space.clear',
		],
	},
	{
		key: 'image-mood',
		title: '이미지 무드 검수',
		checkKeys: [
			'imagery.style',
			'imagery.photography.classification',
			'photography-ingredient-textures',
			'imagery-misuse',
			'imagery.ai.consistency',
			'color.usage',
		],
	},
	{
		key: 'sns',
		title: 'SNS 콘텐츠 검수',
		checkKeys: [
			'application.sns.format',
			'layout.sns.template',
			'layout.sns.zones',
			'application.sns.caption.legibility',
			'logo.sns.placement',
			'imagery.sns.classification',
			'messaging.sns.copy',
		],
	},
	{
		key: 'web-visual',
		title: '웹/비주얼 템플릿 검수',
		checkKeys: [
			'application.web',
			'color.palette',
			'color.combination',
			'color.contrast',
			'typography.usage',
		],
	},
	{
		key: 'advertisement',
		title: '광고 검수',
		checkKeys: [
			'application.advertisement.format',
			'layout.advertisement.template',
			'layout.advertisement.zones',
			'imagery.advertisement.classification',
			'messaging.advertisement.tagline',
			'messaging.advertisement.copy',
			'messaging.advertisement.boilerplate',
			'spacing.advertisement.scale',
			'color.palette',
		],
	},
	{
		key: 'stationery',
		title: '명함/스테이셔너리 검수',
		checkKeys: [
			'application.stationery.format',
			'application.print.spec',
			'color.palette',
			'typography.usage',
			'typography.family',
			'typography.weight',
			'typography.misuse',
		],
	},
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
  CREATE TYPE "public"."enum_check_scenarios_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__check_scenarios_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__check_scenarios_v_published_locale" AS ENUM('ko', 'en');
  CREATE TABLE "check_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"check_keys" jsonb,
	"archived" boolean DEFAULT false,
	"has_been_published" boolean DEFAULT false,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_check_scenarios_status" DEFAULT 'draft'
  );

  CREATE TABLE "check_scenarios_locales" (
	"title" varchar,
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_check_scenarios_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_key" varchar,
	"version_check_keys" jsonb,
	"version_archived" boolean DEFAULT false,
	"version_has_been_published" boolean DEFAULT false,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__check_scenarios_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__check_scenarios_v_published_locale",
	"latest" boolean
  );

  CREATE TABLE "_check_scenarios_v_locales" (
	"version_title" varchar,
	"version_description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  ALTER TABLE "agent_settings" ALTER COLUMN "available_tools" SET DEFAULT 'Guideline tools can list, search, and read published guideline context. Template tools can find published templates with template checks and prepare downloadable template image attachments from open slot values. Check tools can list currently published check scenarios and inspect attached images with a selected scenario.';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "check_scenarios_id" integer;
  ALTER TABLE "check_scenarios_locales" ADD CONSTRAINT "check_scenarios_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."check_scenarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_check_scenarios_v" ADD CONSTRAINT "_check_scenarios_v_parent_id_check_scenarios_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."check_scenarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_check_scenarios_v_locales" ADD CONSTRAINT "_check_scenarios_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_check_scenarios_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "check_scenarios_key_idx" ON "check_scenarios" USING btree ("key");
  CREATE INDEX "check_scenarios_updated_at_idx" ON "check_scenarios" USING btree ("updated_at");
  CREATE INDEX "check_scenarios_created_at_idx" ON "check_scenarios" USING btree ("created_at");
  CREATE INDEX "check_scenarios__status_idx" ON "check_scenarios" USING btree ("_status");
  CREATE UNIQUE INDEX "check_scenarios_locales_locale_parent_id_unique" ON "check_scenarios_locales" USING btree ("_locale", "_parent_id");
  CREATE INDEX "_check_scenarios_v_parent_idx" ON "_check_scenarios_v" USING btree ("parent_id");
  CREATE INDEX "_check_scenarios_v_version_version_key_idx" ON "_check_scenarios_v" USING btree ("version_key");
  CREATE INDEX "_check_scenarios_v_version_version_updated_at_idx" ON "_check_scenarios_v" USING btree ("version_updated_at");
  CREATE INDEX "_check_scenarios_v_version_version_created_at_idx" ON "_check_scenarios_v" USING btree ("version_created_at");
  CREATE INDEX "_check_scenarios_v_version_version__status_idx" ON "_check_scenarios_v" USING btree ("version__status");
  CREATE INDEX "_check_scenarios_v_created_at_idx" ON "_check_scenarios_v" USING btree ("created_at");
  CREATE INDEX "_check_scenarios_v_updated_at_idx" ON "_check_scenarios_v" USING btree ("updated_at");
  CREATE INDEX "_check_scenarios_v_snapshot_idx" ON "_check_scenarios_v" USING btree ("snapshot");
  CREATE INDEX "_check_scenarios_v_published_locale_idx" ON "_check_scenarios_v" USING btree ("published_locale");
  CREATE INDEX "_check_scenarios_v_latest_idx" ON "_check_scenarios_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_check_scenarios_v_locales_locale_parent_id_unique" ON "_check_scenarios_v_locales" USING btree ("_locale", "_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_check_scenarios_fk" FOREIGN KEY ("check_scenarios_id") REFERENCES "public"."check_scenarios"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_check_scenarios_id_idx" ON "payload_locked_documents_rels" USING btree ("check_scenarios_id");
	`)

	for (const scenario of CHECK_SCENARIOS) {
		const checkKeys = JSON.stringify(scenario.checkKeys)
		const { rows: scenarios } = await db.execute(sql`
			INSERT INTO "check_scenarios"
				("key", "check_keys", "archived", "has_been_published", "updated_at", "created_at", "_status")
			VALUES (${scenario.key}, ${checkKeys}::jsonb, false, true, NOW(), NOW(), 'published')
			RETURNING "id"
		`)
		const scenarioId = scenarios[0]?.id
		if (typeof scenarioId !== 'number') {
			throw new Error(`${scenario.key} Check Scenario 생성에 실패했습니다.`)
		}

		await db.execute(sql`
			INSERT INTO "check_scenarios_locales" ("title", "_locale", "_parent_id")
			VALUES (${scenario.title}, 'ko', ${scenarioId})
		`)

		const { rows: versions } = await db.execute(sql`
			INSERT INTO "_check_scenarios_v"
				("parent_id", "version_key", "version_check_keys", "version_archived", "version_has_been_published", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest")
			VALUES (${scenarioId}, ${scenario.key}, ${checkKeys}::jsonb, false, true, NOW(), NOW(), 'published', NOW(), NOW(), true)
			RETURNING "id"
		`)
		const versionId = versions[0]?.id
		if (typeof versionId !== 'number') {
			throw new Error(`${scenario.key} Check Scenario 버전 생성에 실패했습니다.`)
		}

		await db.execute(sql`
			INSERT INTO "_check_scenarios_v_locales" ("version_title", "_locale", "_parent_id")
			VALUES (${scenario.title}, 'ko', ${versionId})
		`)
	}
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_check_scenarios_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_check_scenarios_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "check_scenarios_id";
  ALTER TABLE "check_scenarios" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "check_scenarios_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_check_scenarios_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_check_scenarios_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "check_scenarios" CASCADE;
  DROP TABLE "check_scenarios_locales" CASCADE;
  DROP TABLE "_check_scenarios_v" CASCADE;
  DROP TABLE "_check_scenarios_v_locales" CASCADE;
  ALTER TABLE "agent_settings" ALTER COLUMN "available_tools" SET DEFAULT 'Guideline tools can list, search, and read published guideline context. Template tools can find published templates with template checks and prepare downloadable template image attachments from open slot values. Check tools can list supported check scenarios and inspect attached images using these scenarios: quick (빠른 기본 검수), image-mood (이미지 무드 검수), sns (SNS 콘텐츠 검수), web-visual (웹/비주얼 템플릿 검수), advertisement (광고 검수), stationery (명함/스테이셔너리 검수).';
  DROP TYPE "public"."enum_check_scenarios_status";
  DROP TYPE "public"."enum__check_scenarios_v_version_status";
  DROP TYPE "public"."enum__check_scenarios_v_published_locale";
	`)
}
