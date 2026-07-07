import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import type { Rule } from '../src/payload-types'
import presetCatalog from './data/preset-catalog.json'

/**
 * scripts/seed-*.ts 수동 시드 4종을 마이그레이션 소유로 통일한 베이스라인 시드.
 * (guideline sections/pages 골격, brand colors 32색, agent skill guideline-qa, rule 프리셋 카탈로그 121)
 *
 * 전부 create-only: 자연키(slug/name/key)가 이미 존재하면 건드리지 않는다.
 * 이유 — 기존 환경(원격 DB)에는 이미 데이터가 있고, 특히 rules는 053900 essenherb 시드가
 * titleKo/tier를 갱신해 두었으므로 upsert로 덮어쓰면 그 갱신과 관리자 수정이 유실된다.
 * down은 비파괴 원칙(053900과 동일)에 따라 아무것도 지우지 않는다.
 */

const GUIDELINE_SECTIONS = [
	{
		title: 'Brand Strategy',
		slug: 'brand-strategy',
		order: 1,
		pages: [
			{ title: 'The Name', slug: 'name', aliases: ['the-name'], order: 0 },
			{ title: 'The Core', slug: 'core', aliases: ['the-core'], order: 1 },
			{ title: 'The Narrative', slug: 'narrative', aliases: ['the-narrative'], order: 2 },
			{ title: 'The Signature', slug: 'signature', aliases: ['the-signature'], order: 3 },
		],
	},
	{
		title: 'Brand Design Elements',
		slug: 'brand-design-elements',
		aliases: ['brand-design-element'],
		order: 2,
		pages: [
			{ title: 'Brand Logo', slug: 'brand-logo', order: 0 },
			{ title: 'Color System', slug: 'color-system', order: 1 },
			{ title: 'Typography', slug: 'typography', order: 2 },
			{ title: 'Illustration', slug: 'illustration', order: 3 },
			{ title: 'Photography', slug: 'photography', order: 4 },
			{ title: 'Visual System', slug: 'visual-system', order: 5 },
		],
	},
	{
		title: 'Brand Applications',
		slug: 'brand-applications',
		order: 3,
		pages: [
			{ title: 'SNS Contents', slug: 'sns-contents', order: 0 },
			{ title: 'AD', slug: 'ad', order: 1 },
			{ title: 'Stationery', slug: 'stationery', order: 2 },
			{ title: 'Package', slug: 'package', order: 3 },
			{ title: 'Etc.', slug: 'etc', order: 4 },
		],
	},
] as const

// Essenherb Brand Identity Guidelines 1.0, B.2 Color System (p.24) — 32색 팔레트
const BRAND_COLORS: {
	name: string
	hex: string
	group: 'blue' | 'gray' | 'green' | 'neutral' | 'purple' | 'red' | 'yellow'
	tone?: number
	pantone?: string
	isMain?: boolean
}[] = [
	{ name: 'White', hex: 'FFFFFF', group: 'neutral', isMain: true },
	{ name: 'Black', hex: '000000', group: 'neutral', isMain: true },
	{ name: 'Red 1', hex: 'FFF0EB', group: 'red', tone: 1, pantone: '705C' },
	{ name: 'Red 2', hex: 'FFB4AA', group: 'red', tone: 2, pantone: '169C' },
	{ name: 'Essenherb Red', hex: 'EA5343', group: 'red', tone: 3, pantone: 'Warm Red C', isMain: true },
	{ name: 'Red 4', hex: '871400', group: 'red', tone: 4, pantone: '7620C' },
	{ name: 'Red 5', hex: '460500', group: 'red', tone: 5, pantone: '188C' },
	{ name: 'Yellow 1', hex: 'FFFAC2', group: 'yellow', tone: 1, pantone: '600C' },
	{ name: 'Yellow 2', hex: 'FFF095', group: 'yellow', tone: 2, pantone: '602C' },
	{ name: 'Yellow 3', hex: 'FFE65F', group: 'yellow', tone: 3, pantone: '7404C' },
	{ name: 'Yellow 4', hex: 'A07D0F', group: 'yellow', tone: 4, pantone: '118C' },
	{ name: 'Yellow 5', hex: '503200', group: 'yellow', tone: 5, pantone: '7575C' },
	{ name: 'Green 1', hex: 'E6FFE6', group: 'green', tone: 1, pantone: '2253C' },
	{ name: 'Green 2', hex: 'A7F5AE', group: 'green', tone: 2, pantone: '2255C' },
	{ name: 'Green 3', hex: '50AE5F', group: 'green', tone: 3, pantone: '2257C' },
	{ name: 'Green 4', hex: '195F30', group: 'green', tone: 4, pantone: '555C' },
	{ name: 'Green 5', hex: '002B1E', group: 'green', tone: 5, pantone: '567C' },
	{ name: 'Blue 1', hex: 'E1F0FF', group: 'blue', tone: 1, pantone: '657C' },
	{ name: 'Blue 2', hex: 'A5CDFF', group: 'blue', tone: 2, pantone: '2717C' },
	{ name: 'Blue 3', hex: '3C87CD', group: 'blue', tone: 3, pantone: '279C' },
	{ name: 'Blue 4', hex: '1E508C', group: 'blue', tone: 4, pantone: '2161C' },
	{ name: 'Blue 5', hex: '001941', group: 'blue', tone: 5, pantone: '2768C' },
	{ name: 'Purple 1', hex: 'FAEBFF', group: 'purple', tone: 1, pantone: '531C' },
	{ name: 'Purple 2', hex: 'EBC8E9', group: 'purple', tone: 2, pantone: '529C' },
	{ name: 'Purple 3', hex: 'A546BE', group: 'purple', tone: 3, pantone: '258C' },
	{ name: 'Purple 4', hex: '692373', group: 'purple', tone: 4, pantone: '260C' },
	{ name: 'Purple 5', hex: '3C0046', group: 'purple', tone: 5, pantone: '7449C' },
	{ name: 'Gray 1', hex: 'FAFAFA', group: 'gray', tone: 1 },
	{ name: 'Gray 2', hex: 'EBEBEB', group: 'gray', tone: 2 },
	{ name: 'Gray 3', hex: 'ACACAC', group: 'gray', tone: 3 },
	{ name: 'Gray 4', hex: '464646', group: 'gray', tone: 4 },
	{ name: 'Gray 5', hex: '151515', group: 'gray', tone: 5 },
]

const GUIDELINE_QA_SKILL = {
	name: 'guideline-qa',
	description: 'Answer questions for creators using published brand guideline context.',
	body: [
		'You answer questions for creators using only published brand guideline context.',
		'Always answer in Korean.',
		'Use listGuidelinePages when the user asks what guideline pages or sections are available.',
		'Use searchGuidelines when the current page context is not enough.',
		'If searchGuidelines returns no useful result, try one broader or synonymous query before giving up.',
		'Use readGuidelineDocument to inspect search results before answering from them.',
		'Do not narrate search or tool activity to the user; provide only the final answer.',
		'If the provided context is not enough, say that a manager review is needed.',
	].join('\n'),
	references: [
		{
			title: 'Evidence boundary',
			body: [
				'Use only published guideline pages, sections, and rules returned by the tools.',
				'Do not invent brand standards, undocumented exceptions, or asset usage rules.',
				'When evidence is incomplete, state what is missing and ask for manager review.',
			].join('\n'),
		},
		{
			title: 'Answer shape',
			body: [
				'Start with the direct answer.',
				'Add the guideline basis as short bullets when useful.',
				'Do not expose tool names, search attempts, or internal reasoning.',
			].join('\n'),
		},
	],
	enabled: true,
}

type CatalogEntry = {
	key: string
	title: string
	category: Rule['category']
	tier?: Rule['tier']
	executor?: Rule['executor']
	paramSchema?: string
	scoring?: string
	input?: string
	note?: string
}

async function ensureCurrentConfigTables(db: MigrateUpArgs['db']) {
	await db.execute(sql`
		ALTER TABLE rules ADD COLUMN IF NOT EXISTS value varchar;
		ALTER TABLE rules ADD COLUMN IF NOT EXISTS evidence varchar;
		CREATE TABLE IF NOT EXISTS guideline_pages_rules (
			"_order" integer NOT NULL,
			"_parent_id" integer NOT NULL,
			"id" varchar PRIMARY KEY NOT NULL,
			"rule_id" integer,
			"value" varchar,
			"evidence" varchar,
			"source_page" numeric
		);
		CREATE TABLE IF NOT EXISTS _guideline_pages_v_version_rules (
			"_order" integer NOT NULL,
			"_parent_id" integer NOT NULL,
			"id" serial PRIMARY KEY NOT NULL,
			"rule_id" integer,
			"value" varchar,
			"evidence" varchar,
			"source_page" numeric,
			"_uuid" varchar
		);
		CREATE TABLE IF NOT EXISTS rules_rels (
			id serial PRIMARY KEY,
			"order" integer,
			parent_id integer NOT NULL,
			path varchar NOT NULL,
			application_images_id integer
		);
	`)
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	await ensureCurrentConfigTables(db)

	// 1) guideline sections/pages 골격 (slug + alias 자연키, create-only)
	for (const section of GUIDELINE_SECTIONS) {
		const aliases = 'aliases' in section ? section.aliases : []
		const foundSection = await payload.find({
			collection: 'sections',
			where: { or: [section.slug, ...aliases].map((slug) => ({ slug: { equals: slug } })) },
			limit: 1,
			depth: 0,
			locale: 'ko',
			req,
		})
		const sectionId =
			foundSection.docs[0]?.id ??
			(
				await payload.create({
					collection: 'sections',
					data: {
						title: section.title,
						slug: section.slug,
						displayOrder: section.order,
						_status: 'published',
					},
					locale: 'ko',
					req,
				})
			).id

		for (const page of section.pages) {
			const pageAliases = 'aliases' in page ? page.aliases : []
			const foundPage = await payload.find({
				collection: 'guideline-pages',
				where: { or: [page.slug, ...pageAliases].map((slug) => ({ slug: { equals: slug } })) },
				limit: 1,
				depth: 0,
				locale: 'ko',
				req,
			})
			if (foundPage.docs[0]) continue
			await payload.create({
				collection: 'guideline-pages',
				data: {
					title: page.title,
					slug: page.slug,
					displayOrder: page.order,
					section: sectionId,
					_status: 'published',
				},
				locale: 'ko',
				req,
			})
		}
	}

	// 2) brand colors 32색 (name 자연키, create-only)
	for (const color of BRAND_COLORS) {
		const existing = await payload.find({
			collection: 'brand-colors',
			where: { name: { equals: color.name } },
			limit: 1,
			depth: 0,
			locale: 'ko',
			req,
		})
		if (existing.docs[0]) continue
		await payload.create({
			collection: 'brand-colors',
			data: {
				name: color.name,
				hex: `#${color.hex}`,
				pantone: color.pantone ?? null,
				colorGroup: color.group,
				tone: color.tone ?? null,
				isMain: color.isMain ?? false,
				_status: 'published',
			},
			locale: 'ko',
			req,
		})
	}

	// 3) agent skill guideline-qa (name 자연키, create-only)
	const existingSkill = await payload.find({
		collection: 'agent-skills',
		where: { name: { equals: GUIDELINE_QA_SKILL.name } },
		limit: 1,
		depth: 0,
		req,
	})
	if (!existingSkill.docs[0]) {
		await payload.create({ collection: 'agent-skills', data: GUIDELINE_QA_SKILL, req })
	}

	// 4) rule 프리셋 카탈로그 121 (key 자연키, create-only — 기존 key는 053900 시드·관리자 수정 보존)
	for (const entry of presetCatalog as CatalogEntry[]) {
		const existing = await payload.find({
			collection: 'rules',
			where: { key: { equals: entry.key } },
			limit: 1,
			depth: 0,
			req,
		})
		if (existing.docs[0]) continue
		await payload.create({
			collection: 'rules',
			// 당시 스키마의 필드 — 20260707_130000에서 제거돼 현재 타입에는 없다.
			data: {
				key: entry.key,
				title: entry.title,
				category: entry.category,
				tier: entry.tier,
				executor: entry.executor,
				paramSchema: entry.paramSchema,
				scoring: entry.scoring,
				input: entry.input,
				notes: entry.note,
				status: 'live',
			} as never,
			req,
		})
	}
}

export async function down(_args: MigrateDownArgs): Promise<void> {
	// 비파괴 원칙: 시드 대상 컬렉션은 운영 데이터와 섞여 있어 down에서 지우지 않는다.
}
