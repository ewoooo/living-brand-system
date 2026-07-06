import path from 'node:path'
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import type { ColumnUnitBlock, GuidelinePage } from '../src/payload-types'

type PageRule = NonNullable<GuidelinePage['rules']>[number]
type RichText = NonNullable<NonNullable<ColumnUnitBlock['columns']>[number]['body']>

const ASSETS = [
	{
		key: 'structure',
		name: 'Essen Flux structural sample',
		alt: 'Essen Flux signature typeface structural sample showing top-aligned rhythm and glyph construction',
		file: 'essen-flux-structure.png',
	},
	{
		key: 'glyphs',
		name: 'Essen Flux glyph set',
		alt: 'Essen Flux uppercase, lowercase, number, and symbol glyph set',
		file: 'essen-flux-glyphs.png',
	},
	{
		key: 'usage',
		name: 'Essen Flux usage and casing examples',
		alt: 'Essen Flux mixed case, lowercase, all caps, sentence, and paragraph usage examples',
		file: 'essen-flux-usage.png',
	},
] as const

const RULE_ASSETS: Record<string, (typeof ASSETS)[number]['key'][]> = {
	'typography.case-policy': ['usage'],
	'typography.families': ['structure', 'glyphs'],
	'typography.misuse': ['usage'],
	'typography.pairing': ['usage'],
	'typography.spacing': ['structure', 'usage'],
	'typography.usage': ['usage'],
	'typography.weights': ['glyphs'],
}

const TYPOGRAPHY_BLOCK_TITLE = 'Signature Typeface: Essen Flux'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		ALTER TABLE "guideline_pages_rels" ADD COLUMN IF NOT EXISTS "application_images_id" integer;
		ALTER TABLE "_guideline_pages_v_rels" ADD COLUMN IF NOT EXISTS "application_images_id" integer;
		CREATE INDEX IF NOT EXISTS "guideline_pages_rels_application_images_id_idx" ON "guideline_pages_rels" USING btree ("application_images_id");
		CREATE INDEX IF NOT EXISTS "_guideline_pages_v_rels_application_images_id_idx" ON "_guideline_pages_v_rels" USING btree ("application_images_id");
		DO $$ BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint WHERE conname = 'guideline_pages_rels_application_images_fk'
			) THEN
				ALTER TABLE "guideline_pages_rels"
				ADD CONSTRAINT "guideline_pages_rels_application_images_fk"
				FOREIGN KEY ("application_images_id") REFERENCES "public"."application_images"("id")
				ON DELETE cascade ON UPDATE no action;
			END IF;
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint WHERE conname = '_guideline_pages_v_rels_application_images_fk'
			) THEN
				ALTER TABLE "_guideline_pages_v_rels"
				ADD CONSTRAINT "_guideline_pages_v_rels_application_images_fk"
				FOREIGN KEY ("application_images_id") REFERENCES "public"."application_images"("id")
				ON DELETE cascade ON UPDATE no action;
			END IF;
		END $$;
	`)

	const assetIds: Record<string, number> = {}
	for (const asset of ASSETS) {
		const existing = await payload.find({
			collection: 'application-images',
			where: { name: { equals: asset.name } },
			limit: 1,
			depth: 0,
			locale: 'ko',
			req,
		})
		const data = { name: asset.name, alt: asset.alt, _status: 'published' as const }
		const filePath = path.resolve(process.cwd(), 'migrations/assets', asset.file)
		const doc = existing.docs[0]
			? await payload.update({
					collection: 'application-images',
					id: existing.docs[0].id,
					data,
					filePath,
					locale: 'ko',
					req,
				})
			: await payload.create({
					collection: 'application-images',
					data,
					filePath,
					locale: 'ko',
					req,
				})
		assetIds[asset.key] = doc.id as number
	}

	const page = await findTypographyPage(payload, req)
	const rules = (page.rules ?? []).map((placement) => {
		const rule = placement.rule
		const key = typeof rule === 'number' ? null : rule.key
		const referenceAssets = key
			? (RULE_ASSETS[key] ?? []).map((assetKey) => assetIds[assetKey])
			: toIds(placement.referenceAssets)
		return {
			id: placement.id,
			rule: typeof rule === 'number' ? rule : rule.id,
			value: placement.value,
			evidence: placement.evidence,
			referenceAssets,
		}
	})

	await payload.update({
		collection: 'guideline-pages',
		id: page.id,
		data: {
			blocks: upsertTypographyBlock(page.blocks ?? [], assetIds),
			rules,
			_status: 'published',
		},
		locale: 'ko',
		req,
	})
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
	const page = await findTypographyPage(payload, req)
	await payload.update({
		collection: 'guideline-pages',
		id: page.id,
		data: {
			blocks: (page.blocks ?? []).filter(
				(block) => !isTypographyBlock(block, TYPOGRAPHY_BLOCK_TITLE),
			),
			rules: (page.rules ?? []).map((placement) => {
				const rule = placement.rule
				return {
					id: placement.id,
					rule: typeof rule === 'number' ? rule : rule.id,
					value: placement.value,
					evidence: placement.evidence,
					referenceAssets: [],
				}
			}),
		},
		locale: 'ko',
		req,
	})
}

async function findTypographyPage(
	payload: MigrateUpArgs['payload'],
	req: MigrateUpArgs['req'],
): Promise<GuidelinePage> {
	const found = await payload.find({
		collection: 'guideline-pages',
		where: { slug: { equals: 'typography' } },
		limit: 1,
		depth: 2,
		locale: 'ko',
		req,
	})
	const page = found.docs[0]
	if (!page) throw new Error('typography guideline page not found')
	return page
}

function upsertTypographyBlock(
	blocks: NonNullable<GuidelinePage['blocks']>,
	assetIds: Record<string, number>,
) {
	const next = blocks.filter((block) => !isTypographyBlock(block, TYPOGRAPHY_BLOCK_TITLE))
	next.push({
		blockType: 'columnUnit',
		title: TYPOGRAPHY_BLOCK_TITLE,
		columns: [
			{
				heading: 'Structure',
				image: assetIds.structure,
				imageScale: '100',
				body: richText([
					'Essen Flux는 Essenherb 로고를 기반으로 개발된 영문 전용 시그니처 서체입니다.',
					'일반적인 베이스라인이 아니라 상단 기준선에 고정되는 구조를 통해 상승감, 에너지, 경쾌한 리듬을 표현합니다.',
					'브랜드 아이덴티티를 유지하기 위해 글자 형태와 구조를 임의로 변형할 수 없습니다.',
				]),
			},
			{
				heading: 'Glyphs',
				image: assetIds.glyphs,
				imageScale: '100',
				body: richText([
					'대문자, 소문자, 숫자, 기호는 Essen Flux 고유의 좁고 긴 비례, 강한 세로획, 불규칙한 리듬을 기준으로 사용합니다.',
					'PNG 기반 검수에서는 실제 폰트 메타데이터가 아니라 이 글리프 샘플과의 시각적 유사도를 참고합니다.',
				]),
			},
			{
				heading: 'Usage',
				image: assetIds.usage,
				imageScale: '100',
				body: richText([
					'Essen Flux는 캠페인 타이틀, 키 비주얼, 슬로건, 그래픽 모티프처럼 브랜드 콘셉트를 강조하는 제한적 영역에 사용합니다.',
					'단어와 짧은 문장은 Mixed Case 또는 Lowercase Only로 운영합니다.',
					'All Caps 구성은 서체 고유의 리듬감과 조형 균형을 확보하기 어려우므로 사용을 금지합니다.',
				]),
			},
		],
	})
	return next
}

function richText(paragraphs: string[]): RichText {
	return {
		root: {
			type: 'root',
			format: '',
			indent: 0,
			version: 1,
			children: paragraphs.map((text) => ({
				type: 'paragraph',
				format: '',
				indent: 0,
				version: 1,
				children: [
					{
						mode: 'normal',
						text,
						type: 'text',
						style: '',
						detail: 0,
						format: 0,
						version: 1,
					},
				],
				direction: 'ltr',
				textStyle: '',
				textFormat: 0,
			})),
			direction: 'ltr',
		},
	}
}

function isTypographyBlock(
	block: NonNullable<GuidelinePage['blocks']>[number],
	title: string,
): block is ColumnUnitBlock {
	return block.blockType === 'columnUnit' && block.title === title
}

function toIds(values: PageRule['referenceAssets']) {
	return (values ?? []).map((value) => (typeof value === 'number' ? value : value.id))
}
