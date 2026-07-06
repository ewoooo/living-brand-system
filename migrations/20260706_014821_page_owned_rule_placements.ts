import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * 룰 배치를 페이지 소유 구조로 전환: rule-bindings 컬렉션 제거, guideline-pages.rules 배열로 이관.
 * - 앵커 계층(essenherb 시드가 만든 문서 섹션 14 + p-N 스텁 페이지)의 바인딩을
 *   대응하는 콘텐츠 페이지의 rules 배열로 옮기고(sourcePage=원문 페이지 번호), 앵커 계층은 삭제한다.
 * - 이관은 Payload API(update/delete)로 수행해 버전·로케일 정합을 유지한다.
 *   rule_bindings 읽기만 raw SQL이다(컬렉션이 config에서 이미 제거됨).
 * 주의: migrate:create 원본 diff의 color-palette 중복 DDL(043507·050030에서 기적용)은 수동 제거했다.
 * 스냅샷(20260706_014821.json)은 전체 스키마 기준이라 이후 diff는 정상이다.
 */

/** 앵커 섹션 slug → 바인딩이 옮겨갈 콘텐츠 페이지 slug */
const ANCHOR_TO_CONTENT_PAGE: Record<string, string> = {
	'the-name': 'name',
	'the-core': 'core',
	'the-narrative': 'narrative',
	'the-signature': 'signature',
	'brand-logo': 'brand-logo',
	'color-system': 'color-system',
	typography: 'typography',
	illustration: 'illustration',
	photography: 'photography',
	'visual-system': 'visual-system',
	sns: 'sns-contents',
	ad: 'ad',
	stationery: 'stationery',
	package: 'package',
}

interface BindingRow {
	rule_id: number
	value: string | null
	evidence: string | null
	anchor_section_slug: string
	source_page: number
}

/**
 * 바인딩 이관 + 앵커 계층 삭제. 로컬(push 모드) 검증 스크립트가 재사용할 수 있게 분리.
 * 멱등: rules 배열이 이미 채워진 콘텐츠 페이지는 건너뛰고, 앵커가 없으면 아무것도 안 한다.
 */
export async function movePlacementsAndDropAnchors({
	db,
	payload,
	req,
}: Pick<MigrateUpArgs, 'db' | 'payload' | 'req'>): Promise<void> {
	// 1) 바인딩 + 앵커 좌표 읽기 (rule_bindings는 config 밖이라 raw SQL)
	const bindings = await db.execute(sql`
		SELECT rb.rule_id, rb.value, rb.evidence,
		       asl.slug AS anchor_section_slug,
		       (substring(apl.slug from 3))::int AS source_page
		FROM rule_bindings rb
		JOIN guideline_pages ap ON ap.id = rb.page_id
		JOIN guideline_pages_locales apl ON apl._parent_id = ap.id AND apl._locale = 'ko' AND apl.slug LIKE 'p-%'
		JOIN guideline_sections asec ON asec.id = ap.section_id
		JOIN guideline_sections_locales asl ON asl._parent_id = asec.id AND asl._locale = 'ko'
		ORDER BY rb.id`)
	const rows = (bindings.rows ?? []) as unknown as BindingRow[]

	// 2) 콘텐츠 페이지별로 묶어 rules 배열로 업데이트 (Payload API — 버전·로케일 정합 유지)
	const byContentSlug = new Map<string, BindingRow[]>()
	for (const row of rows) {
		const contentSlug = ANCHOR_TO_CONTENT_PAGE[row.anchor_section_slug]
		if (!contentSlug) continue
		const list = byContentSlug.get(contentSlug) ?? []
		list.push(row)
		byContentSlug.set(contentSlug, list)
	}

	for (const [contentSlug, placements] of byContentSlug) {
		const found = await payload.find({
			collection: 'guideline-pages',
			where: { slug: { equals: contentSlug } },
			limit: 1,
			depth: 0,
			locale: 'ko',
			req,
		})
		const page = found.docs[0]
		if (!page) {
			payload.logger.warn(`rule placement 이관: 콘텐츠 페이지 없음 — ${contentSlug}`)
			continue
		}
		if ((page.rules?.length ?? 0) > 0) continue // 재실행 안전
		await payload.update({
			collection: 'guideline-pages',
			id: page.id,
			data: {
				rules: placements.map((placement) => ({
					rule: placement.rule_id,
					value: placement.value,
					evidence: placement.evidence,
					sourcePage: placement.source_page,
				})),
			},
			locale: 'ko',
			req,
		})
	}

	// 이관 완료 후 바인딩 행 제거 — page_id FK(ON DELETE set null)가 NOT NULL 컬럼이라
	// 행이 남아 있으면 아래 앵커 페이지 삭제가 not-null 위반으로 실패한다. (테이블 drop은 up 마지막)
	await db.execute(sql`DELETE FROM rule_bindings`)

	// 3) 앵커 계층 삭제 (스텁 페이지 → 섹션 순서; Payload API로 버전·로케일까지 정리)
	for (const anchorSlug of Object.keys(ANCHOR_TO_CONTENT_PAGE)) {
		const found = await payload.find({
			collection: 'sections',
			where: { slug: { equals: anchorSlug } },
			limit: 1,
			depth: 0,
			locale: 'ko',
			req,
		})
		const section = found.docs[0]
		if (!section) continue
		// 콘텐츠 섹션과 slug가 겹치지 않는지 확인: 앵커 섹션은 p-N 스텁 페이지만 가진다.
		const pages = await payload.find({
			collection: 'guideline-pages',
			where: { section: { equals: section.id } },
			limit: 200,
			depth: 0,
			locale: 'ko',
			req,
		})
		const slugs = pages.docs.map((page) => page.slug ?? '')
		if (!slugs.every((slug) => /^p-\d+$/.test(slug))) {
			payload.logger.warn(`앵커 섹션 삭제 건너뜀(스텁 외 페이지 존재): ${anchorSlug}`)
			continue
		}
		await payload.delete({
			collection: 'guideline-pages',
			where: { section: { equals: section.id } },
			req,
		})
		await payload.delete({ collection: 'sections', id: section.id, req })
	}
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	// 새 배치 테이블 생성 (이관이 먼저 필요하므로 rule_bindings drop은 마지막에)
	await db.execute(sql`
   CREATE TABLE "guideline_pages_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rule_id" integer,
  	"value" varchar,
  	"evidence" varchar,
  	"source_page" numeric
  );

  CREATE TABLE "_guideline_pages_v_version_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rule_id" integer,
  	"value" varchar,
  	"evidence" varchar,
  	"source_page" numeric,
  	"_uuid" varchar
  );

  ALTER TABLE "guideline_pages_rules" ADD CONSTRAINT "guideline_pages_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_pages_rules" ADD CONSTRAINT "guideline_pages_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_version_rules" ADD CONSTRAINT "_guideline_pages_v_version_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_version_rules" ADD CONSTRAINT "_guideline_pages_v_version_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_pages_rules_order_idx" ON "guideline_pages_rules" USING btree ("_order");
  CREATE INDEX "guideline_pages_rules_parent_id_idx" ON "guideline_pages_rules" USING btree ("_parent_id");
  CREATE INDEX "guideline_pages_rules_rule_idx" ON "guideline_pages_rules" USING btree ("rule_id");
  CREATE INDEX "_guideline_pages_v_version_rules_order_idx" ON "_guideline_pages_v_version_rules" USING btree ("_order");
  CREATE INDEX "_guideline_pages_v_version_rules_parent_id_idx" ON "_guideline_pages_v_version_rules" USING btree ("_parent_id");
  CREATE INDEX "_guideline_pages_v_version_rules_rule_idx" ON "_guideline_pages_v_version_rules" USING btree ("rule_id");`)

	// 데이터 이관 + 앵커 계층 삭제 (rule_bindings가 아직 살아 있는 시점)
	await movePlacementsAndDropAnchors({ db, payload, req })

	// 구 구조 제거: rule_bindings, 구 rules hasMany rels, 미사용 company_name 인덱스
	await db.execute(sql`
   ALTER TABLE "rule_bindings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rule_bindings" CASCADE;
  ALTER TABLE "guideline_pages_rels" DROP CONSTRAINT IF EXISTS "guideline_pages_rels_rules_fk";
  ALTER TABLE "_guideline_pages_v_rels" DROP CONSTRAINT IF EXISTS "_guideline_pages_v_rels_rules_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_rule_bindings_fk";
  DROP INDEX IF EXISTS "guideline_pages_rels_rules_id_idx";
  DROP INDEX IF EXISTS "_guideline_pages_v_rels_rules_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_rule_bindings_id_idx";
  DROP INDEX IF EXISTS "guideline_company_name_idx";
  DROP INDEX IF EXISTS "_guideline_v_version_version_company_name_idx";
  ALTER TABLE "guideline_pages_rels" DROP COLUMN IF EXISTS "rules_id";
  ALTER TABLE "_guideline_pages_v_rels" DROP COLUMN IF EXISTS "rules_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "rule_bindings_id";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	// 구조만 되돌린다 — 이관·삭제된 데이터(바인딩, 앵커 계층)는 down으로 복원하지 않는다.
	await db.execute(sql`
   CREATE TABLE "rule_bindings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_id" integer NOT NULL,
  	"rule_id" integer NOT NULL,
  	"value" varchar,
  	"evidence" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "guideline_pages_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_pages_v_version_rules" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_pages_rules" CASCADE;
  DROP TABLE "_guideline_pages_v_version_rules" CASCADE;
  ALTER TABLE "guideline_pages_rels" ADD COLUMN "rules_id" integer;
  ALTER TABLE "_guideline_pages_v_rels" ADD COLUMN "rules_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rule_bindings_id" integer;
  ALTER TABLE "rule_bindings" ADD CONSTRAINT "rule_bindings_page_id_guideline_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."guideline_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rule_bindings" ADD CONSTRAINT "rule_bindings_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "rule_bindings_page_idx" ON "rule_bindings" USING btree ("page_id");
  CREATE INDEX "rule_bindings_rule_idx" ON "rule_bindings" USING btree ("rule_id");
  CREATE INDEX "rule_bindings_updated_at_idx" ON "rule_bindings" USING btree ("updated_at");
  CREATE INDEX "rule_bindings_created_at_idx" ON "rule_bindings" USING btree ("created_at");
  ALTER TABLE "guideline_pages_rels" ADD CONSTRAINT "guideline_pages_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_pages_v_rels" ADD CONSTRAINT "_guideline_pages_v_rels_rules_fk" FOREIGN KEY ("rules_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rule_bindings_fk" FOREIGN KEY ("rule_bindings_id") REFERENCES "public"."rule_bindings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_pages_rels_rules_id_idx" ON "guideline_pages_rels" USING btree ("rules_id");
  CREATE INDEX "_guideline_pages_v_rels_rules_id_idx" ON "_guideline_pages_v_rels" USING btree ("rules_id");
  CREATE INDEX "payload_locked_documents_rels_rule_bindings_id_idx" ON "payload_locked_documents_rels" USING btree ("rule_bindings_id");`)
}
