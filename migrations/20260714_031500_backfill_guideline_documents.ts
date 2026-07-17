import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import type { GuidelineDocument } from '../src/payload-types'

const LEGACY_COLLECTIONS = [
	'guideline-chapters',
	'guideline-sections',
	'guideline-pages',
] as const
const LOCALES = ['ko', 'en'] as const
const MIGRATION_CONTEXT = { skipGuidelineCheckUniqueness: true }

type LegacyCollection = (typeof LEGACY_COLLECTIONS)[number]
type Locale = (typeof LOCALES)[number]
type LegacyDocument = {
	_status?: 'draft' | 'published' | null
	blocks?: GuidelineDocument['blocks']
	chapter?: number | { id: number } | null
	// 레거시 문서의 임베디드 Check. 현재 config에는 없는 필드라 create 시 무시된다.
	checks?: unknown
	description?: GuidelineDocument['description'] | string | null
	displayOrder: number
	headerImage?: GuidelineDocument['headerImage']
	id: number
	label?: string | null
	section?: number | { id: number } | null
	slug: string
	title: string
}
type LocalizedState = Record<Locale, LegacyDocument | undefined>

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	// Local API 기반 마이그레이션은 현재 config를 기준으로 쿼리를 만든다. 현재 config의
	// guidelineChecksField()에는 criteria 배열 하위 필드가 있으므로 payload.find/create/update가
	// 모든 checks 테이블에 checks_criteria 조인을 건다. 그러나 criteria 테이블은 체인 뒤쪽
	// (121152)에서야 docs용으로만 생성되고, 레거시 컬렉션(sections/pages)용은 어떤 DDL도 만들지
	// 않는다. 따라서 이 백필(031500)과 095159가 Local API를 호출하기 전에, 현재 config가 기대하는
	// 모든 criteria 테이블을 IF NOT EXISTS로 미리 만들어 둔다. 레거시 criteria 테이블은
	// 040034에서 명시적으로 드롭한다.
	// 이때 아래 loadStates의 payload.find는 req 없이 별도 풀 커넥션에서 실행되므로, 마이그레이션
	// 트랜잭션 안(db.execute)에서 만든 테이블은 보이지 않는다. 커밋되어 모든 커넥션에 보이도록
	// 어댑터 pool로 직접(autocommit) 생성한다.
	const { pool } = payload.db as unknown as { pool: { query(text: string): Promise<unknown> } }
	// 현재 이미지 블록 config가 백필 뒤에 추가된 필드를 조회하므로, Local API를 호출하기 전에
	// 대상 테이블은 최종 타입으로 확장하고 곧 제거할 레거시 테이블은 varchar 호환 컬럼만 둔다.
	await pool.query(`
		DO $$ BEGIN
			CREATE TYPE "public"."enum_guideline_docs_blocks_column_unit_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
		DO $$ BEGIN
			CREATE TYPE "public"."enum__guideline_docs_v_blocks_column_unit_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
		DO $$ BEGIN
			CREATE TYPE "public"."enum_guideline_docs_blocks_media_showcase_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
		DO $$ BEGIN
			CREATE TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_image_ratio" AS ENUM('4:3', '1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;

		ALTER TABLE "guideline_docs_blocks_column_unit" ADD COLUMN IF NOT EXISTS "image_ratio" "enum_guideline_docs_blocks_column_unit_image_ratio" DEFAULT '4:3';
		ALTER TABLE "_guideline_docs_v_blocks_column_unit" ADD COLUMN IF NOT EXISTS "image_ratio" "enum__guideline_docs_v_blocks_column_unit_image_ratio" DEFAULT '4:3';
		ALTER TABLE "guideline_docs_blocks_media_showcase" ADD COLUMN IF NOT EXISTS "image_ratio" "enum_guideline_docs_blocks_media_showcase_image_ratio" DEFAULT '16:9';
		ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD COLUMN IF NOT EXISTS "image_ratio" "enum__guideline_docs_v_blocks_media_showcase_image_ratio" DEFAULT '16:9';

		ALTER TABLE "section_cu" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '4:3';
		ALTER TABLE "_section_cu_v" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '4:3';
		ALTER TABLE "section_ms" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '16:9';
		ALTER TABLE "_section_ms_v" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '16:9';
		ALTER TABLE "guideline_pages_blocks_column_unit" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '4:3';
		ALTER TABLE "_guideline_pages_v_blocks_column_unit" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '4:3';
		ALTER TABLE "guideline_pages_blocks_media_showcase" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '16:9';
		ALTER TABLE "_guideline_pages_v_blocks_media_showcase" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '16:9';

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
		DO $$ BEGIN
			CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_groups_kind" AS ENUM('do', 'ok', 'dont');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
		DO $$ BEGIN
			CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_groups_kind" AS ENUM('do', 'ok', 'dont');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;

		ALTER TABLE "guideline_docs_blocks_do_dont" ADD COLUMN IF NOT EXISTS "image_ratio" "enum_guideline_docs_blocks_do_dont_image_ratio" DEFAULT '4:3';
		ALTER TABLE "_guideline_docs_v_blocks_do_dont" ADD COLUMN IF NOT EXISTS "image_ratio" "enum__guideline_docs_v_blocks_do_dont_image_ratio" DEFAULT '4:3';
		ALTER TABLE "guideline_docs_blocks_do_dont" ADD COLUMN IF NOT EXISTS "group_layout" "enum_guideline_docs_blocks_do_dont_group_layout" DEFAULT 'vertical';
		ALTER TABLE "_guideline_docs_v_blocks_do_dont" ADD COLUMN IF NOT EXISTS "group_layout" "enum__guideline_docs_v_blocks_do_dont_group_layout" DEFAULT 'vertical';
		ALTER TABLE "guideline_docs_blocks_do_dont_groups" ADD COLUMN IF NOT EXISTS "kind" "enum_guideline_docs_blocks_do_dont_groups_kind" DEFAULT 'dont';
		ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups" ADD COLUMN IF NOT EXISTS "kind" "enum__guideline_docs_v_blocks_do_dont_groups_kind" DEFAULT 'dont';
		ALTER TABLE "guideline_docs_blocks_do_dont_groups_locales" ADD COLUMN IF NOT EXISTS "description" varchar;
		ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" ADD COLUMN IF NOT EXISTS "description" varchar;

		ALTER TABLE "section_dd" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '4:3';
		ALTER TABLE "_section_dd_v" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '4:3';
		ALTER TABLE "section_dd" ADD COLUMN IF NOT EXISTS "group_layout" varchar DEFAULT 'vertical';
		ALTER TABLE "_section_dd_v" ADD COLUMN IF NOT EXISTS "group_layout" varchar DEFAULT 'vertical';
		ALTER TABLE "section_dd_groups" ADD COLUMN IF NOT EXISTS "kind" varchar DEFAULT 'dont';
		ALTER TABLE "_section_dd_v_groups" ADD COLUMN IF NOT EXISTS "kind" varchar DEFAULT 'dont';
		ALTER TABLE "section_dd_groups_locales" ADD COLUMN IF NOT EXISTS "description" varchar;
		ALTER TABLE "_section_dd_v_groups_locales" ADD COLUMN IF NOT EXISTS "description" varchar;

		ALTER TABLE "guideline_pages_blocks_do_dont" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '4:3';
		ALTER TABLE "_guideline_pages_v_blocks_do_dont" ADD COLUMN IF NOT EXISTS "image_ratio" varchar DEFAULT '4:3';
		ALTER TABLE "guideline_pages_blocks_do_dont" ADD COLUMN IF NOT EXISTS "group_layout" varchar DEFAULT 'vertical';
		ALTER TABLE "_guideline_pages_v_blocks_do_dont" ADD COLUMN IF NOT EXISTS "group_layout" varchar DEFAULT 'vertical';
		ALTER TABLE "guideline_pages_blocks_do_dont_groups" ADD COLUMN IF NOT EXISTS "kind" varchar DEFAULT 'dont';
		ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups" ADD COLUMN IF NOT EXISTS "kind" varchar DEFAULT 'dont';
		ALTER TABLE "guideline_pages_blocks_do_dont_groups_locales" ADD COLUMN IF NOT EXISTS "description" varchar;
		ALTER TABLE "_guideline_pages_v_blocks_do_dont_groups_locales" ADD COLUMN IF NOT EXISTS "description" varchar;

		UPDATE "section_dd_groups" g SET "kind" = (
			SELECT e."kind"::text FROM "section_dd_groups_examples" e
			WHERE e."_parent_id" = g."id" ORDER BY e."_order" LIMIT 1
		) WHERE EXISTS (SELECT 1 FROM "section_dd_groups_examples" e WHERE e."_parent_id" = g."id");
		UPDATE "_section_dd_v_groups" g SET "kind" = (
			SELECT e."kind"::text FROM "_section_dd_v_groups_examples" e
			WHERE e."_parent_id" = g."id" ORDER BY e."_order" LIMIT 1
		) WHERE EXISTS (SELECT 1 FROM "_section_dd_v_groups_examples" e WHERE e."_parent_id" = g."id");
		UPDATE "guideline_pages_blocks_do_dont_groups" g SET "kind" = (
			SELECT e."kind"::text FROM "guideline_pages_blocks_do_dont_groups_examples" e
			WHERE e."_parent_id" = g."id" ORDER BY e."_order" LIMIT 1
		) WHERE EXISTS (SELECT 1 FROM "guideline_pages_blocks_do_dont_groups_examples" e WHERE e."_parent_id" = g."id");
		UPDATE "_guideline_pages_v_blocks_do_dont_groups" g SET "kind" = (
			SELECT e."kind"::text FROM "_guideline_pages_v_blocks_do_dont_groups_examples" e
			WHERE e."_parent_id" = g."id" ORDER BY e."_order" LIMIT 1
		) WHERE EXISTS (SELECT 1 FROM "_guideline_pages_v_blocks_do_dont_groups_examples" e WHERE e."_parent_id" = g."id");
	`)

	await pool.query(`
		DO $precreate$
		DECLARE
			parent text;
			child text;
			-- id/_parent_id가 varchar인 발행/메인 checks 테이블
			varchar_parents text[] := ARRAY[
				'guideline_docs_checks',
				'guideline_docs_blocks_column_unit_checks',
				'guideline_docs_blocks_media_showcase_checks',
				'guideline_docs_blocks_color_palette_checks',
				'guideline_docs_blocks_do_dont_checks',
				'guideline_sections_checks',
				'section_cu_checks',
				'section_ms_checks',
				'section_cp_checks',
				'section_dd_checks',
				'guideline_pages_checks',
				'guideline_pages_blocks_column_unit_checks',
				'guideline_pages_blocks_media_showcase_checks',
				'guideline_pages_blocks_color_palette_checks',
				'guideline_pages_blocks_do_dont_checks'
			];
			-- id가 serial, _parent_id가 integer이고 _uuid를 갖는 버전 checks 테이블
			int_parents text[] := ARRAY[
				'_guideline_docs_v_version_checks',
				'_guideline_docs_v_blocks_column_unit_checks',
				'_guideline_docs_v_blocks_media_showcase_checks',
				'_guideline_docs_v_blocks_color_palette_checks',
				'_guideline_docs_v_blocks_do_dont_checks',
				'_guideline_sections_v_version_checks',
				'_section_cu_v_checks',
				'_section_ms_v_checks',
				'_section_cp_v_checks',
				'_section_dd_v_checks',
				'_guideline_pages_v_version_checks',
				'_guideline_pages_v_blocks_column_unit_checks',
				'_guideline_pages_v_blocks_media_showcase_checks',
				'_guideline_pages_v_blocks_color_palette_checks',
				'_guideline_pages_v_blocks_do_dont_checks'
			];
		BEGIN
			IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_heuristic_criterion_expected') THEN
				CREATE TYPE "public"."enum_heuristic_criterion_expected" AS ENUM('present', 'absent');
			END IF;
			IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_heuristic_criterion_kind') THEN
				CREATE TYPE "public"."enum_heuristic_criterion_kind" AS ENUM('presence', 'measure');
			END IF;
			IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_heuristic_criterion_operator') THEN
				CREATE TYPE "public"."enum_heuristic_criterion_operator" AS ENUM('gte', 'lte', 'between');
			END IF;

			FOREACH parent IN ARRAY varchar_parents LOOP
				child := parent || '_criteria';
				EXECUTE format(
					'CREATE TABLE IF NOT EXISTS %I ('
					|| '"_order" integer NOT NULL,'
					|| '"_parent_id" varchar NOT NULL,'
					|| '"id" varchar PRIMARY KEY NOT NULL,'
					|| '"question" varchar,'
					|| '"expected" "public"."enum_heuristic_criterion_expected",'
					|| '"kind" "public"."enum_heuristic_criterion_kind" DEFAULT ''presence'','
					|| '"operator" "public"."enum_heuristic_criterion_operator",'
					|| '"expected_value" numeric,'
					|| '"max" numeric,'
					|| '"unit" varchar)',
					child
				);
				BEGIN
					EXECUTE format(
						'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("_parent_id") REFERENCES "public".%I("id") ON DELETE cascade ON UPDATE no action',
						child, child || '_parent_id_fk', parent
					);
				EXCEPTION WHEN duplicate_object THEN NULL;
				END;
				EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING btree ("_order")', child || '_order_idx', child);
				EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING btree ("_parent_id")', child || '_parent_id_idx', child);
			END LOOP;

			FOREACH parent IN ARRAY int_parents LOOP
				child := parent || '_criteria';
				EXECUTE format(
					'CREATE TABLE IF NOT EXISTS %I ('
					|| '"_order" integer NOT NULL,'
					|| '"_parent_id" integer NOT NULL,'
					|| '"id" serial PRIMARY KEY NOT NULL,'
					|| '"question" varchar,'
					|| '"expected" "public"."enum_heuristic_criterion_expected",'
					|| '"kind" "public"."enum_heuristic_criterion_kind" DEFAULT ''presence'','
					|| '"operator" "public"."enum_heuristic_criterion_operator",'
					|| '"expected_value" numeric,'
					|| '"max" numeric,'
					|| '"unit" varchar,'
					|| '"_uuid" varchar)',
					child
				);
				BEGIN
					EXECUTE format(
						'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("_parent_id") REFERENCES "public".%I("id") ON DELETE cascade ON UPDATE no action',
						child, child || '_parent_id_fk', parent
					);
				EXCEPTION WHEN duplicate_object THEN NULL;
				END;
				EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING btree ("_order")', child || '_order_idx', child);
				EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING btree ("_parent_id")', child || '_parent_id_idx', child);
			END LOOP;
		END
		$precreate$;
	`)

	await db.execute(sql`DELETE FROM "search";`)

	const documentIds = new Map<string, number>()
	for (const collection of LEGACY_COLLECTIONS) {
		const states = await loadStates(payload, collection)
		payload.logger.info(
			`${collection}: ${states.length}건 중 published ${states.filter(([, state]) => primaryDocument(state.published)).length}건을 백필합니다.`,
		)
		for (const [legacyId, state] of states) {
			const published = primaryDocument(state.published)
			const latest = primaryDocument(state.latest)
			const initial = published ?? latest
			if (!initial) continue

			const initialLocale = localeOf(published ? state.published : state.latest, initial)
			const parent = resolveParent(collection, initial, documentIds)
			if (parent === undefined) {
				payload.logger.warn(`${collection}:${legacyId}는 상위 문서가 없어 백필에서 제외합니다.`)
				continue
			}
			const created = await payload.create({
				collection: 'guideline-documents',
				context: MIGRATION_CONTEXT,
				data: documentData(initial, parent, collection),
				depth: 0,
				draft: !published,
				fallbackLocale: false,
				locale: initialLocale,
				overrideAccess: true,
				req,
			})
			await recordLegacyMapping(db, created.id, initial, initialLocale, collection)
			documentIds.set(legacyKey(collection, legacyId), created.id)

			if (published) {
				await copyOtherLocales(
					payload,
					db,
					created.id,
					state.published,
					initialLocale,
					false,
					collection,
					documentIds,
					req,
				)
			}

			const latestDocument = primaryDocument(state.latest)
			if (latestDocument?._status === 'draft') {
				await copyLocales(
					payload,
					db,
					created.id,
					state.latest,
					true,
					collection,
					documentIds,
					req,
				)
			}
		}
	}

	await db.execute(sql`
		WITH "ranked_versions" AS (
			SELECT
				"id",
				row_number() OVER (
					PARTITION BY "parent_id", "version__status"
					ORDER BY "id" DESC
				) AS "state_rank"
			FROM "_guideline_docs_v"
		)
		DELETE FROM "_guideline_docs_v"
		WHERE "id" IN (
			SELECT "id" FROM "ranked_versions" WHERE "state_rank" > 1
		);

		UPDATE "_guideline_docs_v" SET "latest" = false;

		WITH "latest_versions" AS (
			SELECT DISTINCT ON ("parent_id") "id"
			FROM "_guideline_docs_v"
			ORDER BY "parent_id", "id" DESC
		)
		UPDATE "_guideline_docs_v"
		SET "latest" = true
		WHERE "id" IN (SELECT "id" FROM "latest_versions");
	`)

	await db.execute(sql`DELETE FROM "search";`)
	await rebuildGuidelineSearch(payload, req)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DELETE FROM "search"
		WHERE "id" IN (
			SELECT "parent_id"
			FROM "search_rels"
			WHERE "guideline_docs_id" IS NOT NULL
		);

		DELETE FROM "guideline_docs"
		WHERE "legacy_collection" IS NOT NULL AND "legacy_id" IS NOT NULL;
	`)
}

async function loadStates(
	payload: Payload,
	collection: LegacyCollection,
) {
	const publishedKo = await loadPublishedDocuments(payload, collection, 'ko')
	const publishedEn = await loadPublishedDocuments(payload, collection, 'en')
	const latestKo = await loadDraftDocuments(payload, collection, 'ko')
	const latestEn = await loadDraftDocuments(payload, collection, 'en')
	const ids = new Set([
		...publishedKo.keys(),
		...publishedEn.keys(),
		...latestKo.keys(),
		...latestEn.keys(),
	])

	return [...ids]
		.sort((a, b) => a - b)
		.map(
			(id) =>
				[
					id,
					{
						published: { ko: publishedKo.get(id), en: publishedEn.get(id) },
						latest: { ko: latestKo.get(id), en: latestEn.get(id) },
					},
				] as const,
		)
}

async function rebuildGuidelineSearch(payload: Payload, req: MigrateUpArgs['req']) {
	const published = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: false,
		fallbackLocale: 'en',
		limit: 0,
		locale: 'ko',
		overrideAccess: true,
		pagination: false,
		req,
	})

	for (const document of published.docs) {
		await payload.create({
			collection: 'search',
			data: {
				title: document.title,
				priority: 20,
				doc: { relationTo: 'guideline-documents', value: document.id },
			},
			depth: 0,
			overrideAccess: true,
			req,
		})
	}
}

async function loadPublishedDocuments(
	payload: Payload,
	collection: LegacyCollection,
	locale: Locale,
) {
	const result = await payload.find({
		collection: collection as never,
		depth: 0,
		draft: false,
		fallbackLocale: false,
		limit: 0,
		locale,
		overrideAccess: true,
		pagination: false,
	})

	return new Map(
		result.docs.map((document) => {
			const legacyDocument = document as unknown as LegacyDocument
			return [legacyDocument.id, legacyDocument]
		}),
	)
}

async function loadDraftDocuments(
	payload: Payload,
	collection: LegacyCollection,
	locale: Locale,
) {
	const result = await payload.findVersions({
		collection: collection as never,
		depth: 0,
		fallbackLocale: false,
		limit: 0,
		locale,
		overrideAccess: true,
		pagination: false,
		sort: '-createdAt',
	})
	const documents = new Map<number, LegacyDocument>()
	const visited = new Set<number>()
	for (const entry of result.docs) {
		const id = relationshipId(entry.parent)
		if (id === null || visited.has(id)) continue
		visited.add(id)
		const version = entry.version as unknown as LegacyDocument
		if (version._status !== 'draft') continue
		documents.set(id, { ...version, id })
	}
	return documents
}

async function copyOtherLocales(
	payload: Payload,
	db: MigrateUpArgs['db'],
	documentId: number,
	state: LocalizedState,
	initialLocale: Locale,
	draft: boolean,
	collection: LegacyCollection,
	documentIds: Map<string, number>,
	req: MigrateUpArgs['req'],
) {
	for (const locale of LOCALES) {
		if (locale === initialLocale) continue
		const document = state[locale]
		if (!document || !hasRequiredCopy(document)) continue
		await updateLocale(
			payload,
			db,
			documentId,
			document,
			locale,
			draft,
			collection,
			documentIds,
			req,
		)
	}
}

async function copyLocales(
	payload: Payload,
	db: MigrateUpArgs['db'],
	documentId: number,
	state: LocalizedState,
	draft: boolean,
	collection: LegacyCollection,
	documentIds: Map<string, number>,
	req: MigrateUpArgs['req'],
) {
	for (const locale of LOCALES) {
		const document = state[locale]
		if (!document) continue
		await updateLocale(
			payload,
			db,
			documentId,
			document,
			locale,
			draft,
			collection,
			documentIds,
			req,
		)
	}
}

export async function updateLocale(
	payload: Payload,
	db: MigrateUpArgs['db'],
	documentId: number,
	document: LegacyDocument,
	locale: Locale,
	draft: boolean,
	collection: LegacyCollection,
	documentIds: Map<string, number>,
	req: MigrateUpArgs['req'],
) {
	if (!hasRequiredCopy(document)) {
		payload.logger.warn(
			`${collection}:${document.id}의 ${locale} 최신 상태는 필수 번역 필드가 없어 제외합니다.`,
		)
		return
	}
	const parent = resolveParent(collection, document, documentIds)
	if (parent === undefined) {
		payload.logger.warn(`${collection}:${document.id}의 최신 상태는 상위 문서가 없어 제외합니다.`)
		return
	}
	await payload.update({
		collection: 'guideline-documents',
		context: MIGRATION_CONTEXT,
		data: documentData(document, parent, collection),
		depth: 0,
		draft,
		fallbackLocale: false,
		id: documentId,
		locale,
		overrideAccess: true,
		req,
	})
	await recordLegacyMapping(db, documentId, document, locale, collection)
}

function documentData(
	document: LegacyDocument,
	parent: number | null,
	legacyCollection: LegacyCollection,
) {
	return {
		_status: document._status,
		title: document.title,
		...('label' in document ? { label: document.label } : {}),
		generateSlug: false,
		slug: migrationSlug(document.slug, legacyCollection, document.id),
		description: normalizeDescription(document.description),
		...('headerImage' in document
			? { headerImage: relationshipId(document.headerImage) }
			: {}),
		...('checks' in document ? { checks: document.checks } : {}),
		...('blocks' in document ? { blocks: document.blocks } : {}),
		displayOrder: document.displayOrder,
		parent,
	} as never
}

async function recordLegacyMapping(
	db: MigrateUpArgs['db'],
	documentId: number,
	document: LegacyDocument,
	locale: Locale,
	collection: LegacyCollection,
) {
	await db.execute(sql`
		UPDATE "guideline_docs"
		SET
			"legacy_collection" = ${collection},
			"legacy_id" = ${document.id}
		WHERE "id" = ${documentId};
	`)
	await db.execute(sql`
		UPDATE "guideline_docs_locales"
		SET "legacy_slug" = ${document.slug}
		WHERE "_parent_id" = ${documentId} AND "_locale" = ${locale};
	`)
	await db.execute(sql`
		WITH "latest_version" AS (
			SELECT "id"
			FROM "_guideline_docs_v"
			WHERE "parent_id" = ${documentId}
			ORDER BY "id" DESC
			LIMIT 1
		)
		UPDATE "_guideline_docs_v" "version"
		SET
			"version_legacy_collection" = ${collection},
			"version_legacy_id" = ${document.id}
		FROM "latest_version"
		WHERE "version"."id" = "latest_version"."id";
	`)
	await db.execute(sql`
		WITH "latest_version" AS (
			SELECT "id"
			FROM "_guideline_docs_v"
			WHERE "parent_id" = ${documentId}
			ORDER BY "id" DESC
			LIMIT 1
		)
		UPDATE "_guideline_docs_v_locales" "version_locale"
		SET "version_legacy_slug" = "document_locale"."legacy_slug"
		FROM "latest_version", "guideline_docs_locales" "document_locale"
		WHERE
			"version_locale"."_parent_id" = "latest_version"."id"
			AND "document_locale"."_parent_id" = ${documentId}
			AND "document_locale"."_locale" = "version_locale"."_locale";
	`)
}

function migrationSlug(slug: string, collection: LegacyCollection, id: number) {
	const level =
		collection === 'guideline-chapters'
			? 'chapter'
			: collection === 'guideline-sections'
				? 'section'
				: 'page'
	return `${slug}-${level}-${id}`
}

function normalizeDescription(value: LegacyDocument['description']): GuidelineDocument['description'] {
	if (typeof value !== 'string') return value

	return {
		root: {
			type: 'root',
			direction: 'ltr',
			format: '',
			indent: 0,
			version: 1,
			children: [
				{
					type: 'paragraph',
					direction: 'ltr',
					format: '',
					indent: 0,
					version: 1,
					textFormat: 0,
					textStyle: '',
					children: value
						? [
								{
									type: 'text',
									version: 1,
									text: value,
									detail: 0,
									format: 0,
									mode: 'normal',
									style: '',
								},
							]
						: [],
				},
			],
		},
	}
}

function resolveParent(
	collection: LegacyCollection,
	document: LegacyDocument,
	documentIds: Map<string, number>,
): number | null | undefined {
	if (collection === 'guideline-chapters') return null

	const parentCollection =
		collection === 'guideline-sections' ? 'guideline-chapters' : 'guideline-sections'
	const parentValue =
		'chapter' in document ? document.chapter : 'section' in document ? document.section : null
	const parentId = relationshipId(parentValue)
	const mappedId =
		parentId === null ? undefined : documentIds.get(legacyKey(parentCollection, parentId))
	return mappedId
}

function primaryDocument(state: LocalizedState) {
	return LOCALES.map((locale) => state[locale]).find(
		(document): document is LegacyDocument =>
			document !== undefined && hasRequiredCopy(document),
	)
}

function hasRequiredCopy(document: LegacyDocument) {
	return typeof document.title === 'string' && Boolean(document.title) && Boolean(document.slug)
}

function localeOf(state: LocalizedState, document: LegacyDocument): Locale {
	return state.ko === document ? 'ko' : 'en'
}

function relationshipId(value: unknown): number | null {
	if (typeof value === 'number') return value
	if (typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'number') {
		return value.id
	}
	return null
}

function legacyKey(collection: LegacyCollection, id: number) {
	return `${collection}:${id}`
}
