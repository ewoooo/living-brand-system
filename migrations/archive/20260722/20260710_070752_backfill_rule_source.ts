import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		DO $$
		DECLARE
			"duplicate_count" integer;
		BEGIN
			WITH "duplicate_keys"("key") AS (
				VALUES
					('logo.variants'), ('logo.placement'), ('color.pairing'),
					('color.print-fidelity'), ('color.contrast.photo-bg'), ('grid.system'),
					('spacing.scale'), ('layout.template'), ('layout.zones'), ('layout.tone'),
					('imagery.classification'), ('messaging.tagline'), ('messaging.statement'),
					('messaging.boilerplate'), ('messaging.contact-block'),
					('messaging.content-fields'), ('messaging.application-copy'),
					('application.format'), ('application.spec-scale'), ('application.sns')
			)
			SELECT count(*) INTO "duplicate_count"
			FROM "rules" "rule"
			JOIN "duplicate_keys" USING ("key")
			WHERE "rule"."status" = 'archived';

			IF "duplicate_count" <> 20 THEN
				RAISE EXCEPTION 'Expected 20 archived duplicate rules, found %', "duplicate_count";
			END IF;

			IF EXISTS (
				WITH "duplicate_rules" AS (
					SELECT "id" FROM "rules"
					WHERE "key" IN (
						'logo.variants', 'logo.placement', 'color.pairing', 'color.print-fidelity',
						'color.contrast.photo-bg', 'grid.system', 'spacing.scale', 'layout.template',
						'layout.zones', 'layout.tone', 'imagery.classification', 'messaging.tagline',
						'messaging.statement', 'messaging.boilerplate', 'messaging.contact-block',
						'messaging.content-fields', 'messaging.application-copy', 'application.format',
						'application.spec-scale', 'application.sns'
					)
				),
				"references" AS (
					SELECT "parent_id" AS "rule_id" FROM "rules_rels"
					UNION ALL SELECT "rule_id" FROM "guideline_pages_blocks_color_palette"
					UNION ALL SELECT "rule_id" FROM "guideline_pages_blocks_column_unit"
					UNION ALL SELECT "rule_id" FROM "guideline_pages_blocks_do_dont_groups"
					UNION ALL SELECT "rule_id" FROM "guideline_pages_blocks_media_showcase"
					UNION ALL SELECT "rule_id" FROM "section_cp"
					UNION ALL SELECT "rule_id" FROM "section_cu"
					UNION ALL SELECT "rule_id" FROM "section_dd_groups"
					UNION ALL SELECT "rule_id" FROM "section_ms"
					UNION ALL SELECT "rule_id" FROM "templates_template_rules"
					UNION ALL SELECT "rule_id" FROM "_guideline_pages_v_blocks_color_palette"
					UNION ALL SELECT "rule_id" FROM "_guideline_pages_v_blocks_column_unit"
					UNION ALL SELECT "rule_id" FROM "_guideline_pages_v_blocks_do_dont_groups"
					UNION ALL SELECT "rule_id" FROM "_guideline_pages_v_blocks_media_showcase"
					UNION ALL SELECT "rule_id" FROM "_section_cp_v"
					UNION ALL SELECT "rule_id" FROM "_section_cu_v"
					UNION ALL SELECT "rule_id" FROM "_section_dd_v_groups"
					UNION ALL SELECT "rule_id" FROM "_section_ms_v"
					UNION ALL SELECT "rule_id" FROM "_templates_v_version_template_rules"
					UNION ALL SELECT "rules_id" FROM "payload_locked_documents_rels"
				)
				SELECT 1
				FROM "references"
				JOIN "duplicate_rules" ON "duplicate_rules"."id" = "references"."rule_id"
			) THEN
				RAISE EXCEPTION 'Archived duplicate rules are still referenced';
			END IF;
		END $$;

		CREATE TEMP TABLE "_rule_sources" (
			"rule_id" integer PRIMARY KEY,
			"section_id" integer,
			"page_id" integer,
			"block_id" varchar
		) ON COMMIT DROP;

		WITH "source_candidates" AS (
			SELECT
				"document"."parent_id" AS "rule_id",
				"parent"."guideline_sections_id" AS "section_id",
				"parent"."guideline_pages_id" AS "page_id",
				"block"."source_block_id" AS "block_id",
				1 AS "priority",
				"block"."display_order" AS "display_order",
				"block"."id" AS "tie_breaker"
			FROM "rules_rels" "document"
			JOIN "guideline_blocks" "block" ON "block"."id" = "document"."guideline_blocks_id"
			JOIN "guideline_blocks_rels" "parent"
				ON "parent"."parent_id" = "block"."id" AND "parent"."path" = 'parent'
			WHERE "document"."path" = 'documents'
				AND ("parent"."guideline_sections_id" IS NOT NULL OR "parent"."guideline_pages_id" IS NOT NULL)
			UNION ALL
			SELECT "parent_id", NULL, "guideline_pages_id", NULL, 2, 0, "guideline_pages_id"
			FROM "rules_rels"
			WHERE "path" = 'documents' AND "guideline_pages_id" IS NOT NULL
			UNION ALL
			SELECT "parent_id", "guideline_sections_id", NULL, NULL, 3, 0, "guideline_sections_id"
			FROM "rules_rels"
			WHERE "path" = 'documents' AND "guideline_sections_id" IS NOT NULL
		),
		"ranked_sources" AS (
			SELECT *, row_number() OVER (
				PARTITION BY "rule_id"
				ORDER BY "priority", "display_order", "tie_breaker"
			) AS "rank"
			FROM "source_candidates"
		)
		INSERT INTO "_rule_sources" ("rule_id", "section_id", "page_id", "block_id")
		SELECT "rule_id", "section_id", "page_id", "block_id"
		FROM "ranked_sources"
		WHERE "rank" = 1;

		DELETE FROM "rules_rels" WHERE "path" = 'source.document';

		INSERT INTO "rules_rels" (
			"order", "parent_id", "path", "guideline_sections_id", "guideline_pages_id"
		)
		SELECT 1, "rule_id", 'source.document', "section_id", "page_id"
		FROM "_rule_sources";

		UPDATE "rules" "rule"
		SET "source_block_id" = "source"."block_id"
		FROM "_rule_sources" "source"
		WHERE "rule"."id" = "source"."rule_id";

		DELETE FROM "rules"
		WHERE "status" = 'archived'
			AND "key" IN (
				'logo.variants', 'logo.placement', 'color.pairing', 'color.print-fidelity',
				'color.contrast.photo-bg', 'grid.system', 'spacing.scale', 'layout.template',
				'layout.zones', 'layout.tone', 'imagery.classification', 'messaging.tagline',
				'messaging.statement', 'messaging.boilerplate', 'messaging.contact-block',
				'messaging.content-fields', 'messaging.application-copy', 'application.format',
				'application.spec-scale', 'application.sns'
			);
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DELETE FROM "rules_rels" WHERE "path" = 'source.document';
		UPDATE "rules" SET "source_block_id" = NULL;

		WITH "restored" AS (
			SELECT * FROM jsonb_to_recordset($rules$[
				{"id":3,"key":"logo.variants","tier":"recommended","title":"승인된 로고 변형","status":"archived","evidence":null,"checker_id":44,"created_at":"2026-06-26T05:48:36.973+00:00","updated_at":"2026-07-06T00:48:02.803+00:00"},
				{"id":9,"key":"logo.placement","tier":"recommended","title":"콘텐츠 내 로고 배치","status":"archived","evidence":null,"checker_id":44,"created_at":"2026-06-26T05:48:38.646+00:00","updated_at":"2026-07-06T00:48:02.998+00:00"},
				{"id":24,"key":"color.pairing","tier":"required","title":"승인된 색 조합","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:48:42.767+00:00","updated_at":"2026-07-06T00:48:02.838+00:00"},
				{"id":30,"key":"color.print-fidelity","tier":"recommended","title":"인쇄 색 재현 (Pantone)","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:48:44.423+00:00","updated_at":"2026-07-06T00:48:02.834+00:00"},
				{"id":37,"key":"color.contrast.photo-bg","tier":"recommended","title":"배경 위 로고 가독성","status":"archived","evidence":null,"checker_id":44,"created_at":"2026-06-26T05:48:46.349+00:00","updated_at":"2026-07-06T00:48:02.821+00:00"},
				{"id":51,"key":"grid.system","tier":"required","title":"모듈러 그리드 시스템","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:48:50.191+00:00","updated_at":"2026-07-06T00:48:02.97+00:00"},
				{"id":52,"key":"spacing.scale","tier":"required","title":"광고 A-unit 간격 체계","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:48:50.459+00:00","updated_at":"2026-07-06T00:48:03.054+00:00"},
				{"id":53,"key":"layout.template","tier":"required","title":"템플릿 크기·비율","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:48:50.732+00:00","updated_at":"2026-07-06T00:48:02.964+00:00"},
				{"id":55,"key":"layout.zones","tier":"required","title":"콘텐츠 영역 지정 (인물·텍스트)","status":"archived","evidence":null,"checker_id":44,"created_at":"2026-06-26T05:48:51.287+00:00","updated_at":"2026-07-06T00:48:02.993+00:00"},
				{"id":57,"key":"layout.tone","tier":"recommended","title":"레이아웃 톤앤매너 (피드 일관성)","status":"archived","evidence":"'일관된 피드 룩앤필과 브랜드 통일감이 유지되고 있는지'에 유의하여 콘텐츠를 제작·운영해야 한다. 가이드 디자인 예시를 참고해 일관된 피드 룩앤필 및 브랜드 통일감 유지.","checker_id":44,"created_at":"2026-06-26T05:48:51.838+00:00","updated_at":"2026-07-06T10:03:08.116+00:00"},
				{"id":60,"key":"imagery.classification","tier":"recommended","title":"사진 분류·무드 기준","status":"archived","evidence":null,"checker_id":44,"created_at":"2026-06-26T05:48:52.665+00:00","updated_at":"2026-07-06T00:48:02.897+00:00"},
				{"id":81,"key":"messaging.tagline","tier":"recommended","title":"브랜드 시그니처 문구","status":"archived","evidence":"signatures: 'Essence for Energy', 'Daily Skin Energy', 'Essen-tial Skincare'\\n\\nA.4 The Signature: 세 가지 타입 시그니처 '1 Essence for Energy / 2 Daily Skin Energy / 3 Essen-tial Skincare'. 브랜드 철학·태도를 압축한 서명 문구로 정확한 워딩/표기 검증 가능.","checker_id":45,"created_at":"2026-06-26T05:48:58.396+00:00","updated_at":"2026-07-06T10:03:08.09+00:00"},
				{"id":82,"key":"messaging.statement","tier":"recommended","title":"브랜드 본질·철학 문구","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:48:58.667+00:00","updated_at":"2026-07-06T00:48:02.745+00:00"},
				{"id":84,"key":"messaging.boilerplate","tier":"recommended","title":"반복 서술·보일러플레이트","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:48:59.213+00:00","updated_at":"2026-07-06T00:48:02.955+00:00"},
				{"id":85,"key":"messaging.contact-block","tier":"required","title":"연락처·회사 정보 블록","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:48:59.485+00:00","updated_at":"2026-07-06T00:48:03.083+00:00"},
				{"id":88,"key":"messaging.content-fields","tier":"recommended","title":"인쇄물 필수 기재 항목","status":"archived","evidence":null,"checker_id":44,"created_at":"2026-06-26T05:49:00.311+00:00","updated_at":"2026-07-06T00:48:03.089+00:00"},
				{"id":89,"key":"messaging.application-copy","tier":"recommended","title":"콘텐츠 브랜드 스토리 카피","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:49:00.583+00:00","updated_at":"2026-07-06T00:48:02.989+00:00"},
				{"id":90,"key":"application.format","tier":"required","title":"광고 적용 규격·비율","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:49:00.853+00:00","updated_at":"2026-07-06T00:48:03.015+00:00"},
				{"id":95,"key":"application.spec-scale","tier":"required","title":"사양 표기 축척 규칙","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:49:02.211+00:00","updated_at":"2026-07-06T00:48:03.078+00:00"},
				{"id":99,"key":"application.sns","tier":"required","title":"SNS 콘텐츠 규격","status":"archived","evidence":null,"checker_id":45,"created_at":"2026-06-26T05:49:03.301+00:00","updated_at":"2026-07-06T00:48:02.976+00:00"}
			]$rules$::jsonb) AS "rule" (
				"id" integer,
				"key" varchar,
				"tier" varchar,
				"title" varchar,
				"status" varchar,
				"evidence" varchar,
				"checker_id" integer,
				"created_at" timestamptz,
				"updated_at" timestamptz
			)
		)
		INSERT INTO "rules" (
			"id", "key", "tier", "title", "status", "evidence", "checker_id", "created_at", "updated_at"
		)
		SELECT
			"id", "key", "tier"::"enum_rules_tier", "title", "status"::"enum_rules_status",
			"evidence",
			CASE "checker_id"
				WHEN 44 THEN (SELECT "id" FROM "rule_checkers" WHERE "key" = 'model.anthropic.brand-guideline')
				WHEN 45 THEN (SELECT "id" FROM "rule_checkers" WHERE "key" = 'manual.review')
			END,
			"created_at", "updated_at"
		FROM "restored";

		SELECT setval(pg_get_serial_sequence('rules', 'id'), (SELECT max("id") FROM "rules"), true);
	`)
}
