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
	checks?: GuidelineDocument['checks']
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
