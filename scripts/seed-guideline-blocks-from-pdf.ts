/**
 * Seed guideline-pages.blocks from the source PDF.
 *
 * PDF body is the guideline SSOT. Linked rule evidence/referenceAssets are derived by
 * GuidelinePages.afterChange when these pages are saved as published.
 *
 * Run:
 *   PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH" corepack pnpm exec payload run scripts/seed-guideline-blocks-from-pdf.ts
 *
 * Optional:
 *   PDF_PATH="/path/to/Brand Guideline Reference.pdf" PDFTOPPM_BIN="/path/to/pdftoppm" PDFTOTEXT_BIN="/path/to/pdftotext" ...
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const LOCALE = 'ko'
const PDF_PATH = process.env.PDF_PATH ?? '/Users/plusx/Downloads/Brand Guideline Reference.pdf'
const PDFTOPPM = process.env.PDFTOPPM_BIN ?? 'pdftoppm'
const PDFTOTEXT = process.env.PDFTOTEXT_BIN ?? 'pdftotext'
const RENDER_DIR = path.resolve('tmp/pdfs/brand-guideline-reference-pages')

interface PageBlockDef {
	page: number
	title: string
	ruleKey?: string
}

type PageDef =
	| { slug: string; blocks: PageBlockDef[] }
	| { slug: string; colorPalettePage: PageBlockDef }
	| { slug: string; doDont: DoDontDef }
	| { slug: string; mediaPages: PageBlockDef[] }
	| { slug: string; blocks: PageBlockDef[]; doDont: DoDontDef }

interface DoDontDef {
	title: string
	page: number
	groups: {
		category: string
		ruleKey?: string
		examples: { kind: 'do' | 'dont'; caption: string }[]
	}[]
}

const pages: PageDef[] = [
	{ slug: 'cover', mediaPages: [{ page: 1, title: 'Cover' }] },
	{ slug: 'building-our-brand', blocks: [{ page: 2, title: 'Building Our Brand' }] },
	{ slug: 'guidelines-index', blocks: [{ page: 3, title: 'Guidelines Index' }] },
	{ slug: 'the-name', blocks: [{ page: 5, title: 'The Name', ruleKey: 'voice.naming.grammar' }] },
	{
		slug: 'the-core',
		blocks: [{ page: 6, title: 'The Core', ruleKey: 'messaging.key.message' }],
	},
	{
		slug: 'english-version',
		blocks: [{ page: 7, title: 'English Narrative', ruleKey: 'messaging.narrative.statement' }],
	},
	{ slug: 'korean-version', blocks: [{ page: 8, title: 'Korean Narrative' }] },
	{
		slug: 'the-signature',
		blocks: [{ page: 9, title: 'The Signature', ruleKey: 'messaging.signature.combination' }],
	},
	{
		slug: 'primary-logo',
		blocks: [
			{ page: 12, title: 'Design Concept', ruleKey: 'logo.symbol.concept' },
			{ page: 13, title: 'Minimum Size', ruleKey: 'logo.size.minimum' },
			{ page: 14, title: 'Grids & Clear Space', ruleKey: 'logo.space.clear' },
			{ page: 15, title: 'Registered Trademark', ruleKey: 'logo.trademark' },
		],
	},
	{
		slug: 'secondary-logo',
		blocks: [
			{ page: 16, title: 'Minimum Size' },
			{ page: 17, title: 'Grids & Clear Space' },
			{ page: 18, title: 'Registered Trademark' },
		],
	},
	{
		slug: 'service-logo',
		blocks: [
			{ page: 19, title: 'Minimum Size', ruleKey: 'logo.lockup.modifier' },
			{ page: 20, title: 'Grids & Clear Space' },
			{ page: 21, title: 'Registered Trademark' },
		],
	},
	{
		slug: 'incorrect-usage',
		doDont: {
			title: 'Incorrect Usage',
			page: 22,
			groups: [
				{
					category: 'Proportion / Space',
					ruleKey: 'logo.geometry',
					examples: [
						{ kind: 'dont', caption: '로고의 간격을 임의로 조정할 수 없습니다.' },
						{
							kind: 'dont',
							caption: '로고의 비례를 임의로 변형하여 사용할 수 없습니다.',
						},
						{
							kind: 'dont',
							caption: '로고의 기울기를 임의로 변형하여 사용할 수 없습니다.',
						},
					],
				},
				{
					category: 'Shape',
					ruleKey: 'logo.misuse',
					examples: [
						{
							kind: 'dont',
							caption: '로고 요소 일부분의 형태를 변형하여 사용할 수 없습니다.',
						},
						{ kind: 'dont', caption: '로고의 두께를 임의로 변형할 수 없습니다.' },
						{
							kind: 'dont',
							caption: '로고의 형태를 임의로 변형하여 사용할 수 없습니다.',
						},
					],
				},
				{
					category: 'Color',
					ruleKey: 'logo.color.misuse',
					examples: [
						{ kind: 'dont', caption: '로고를 윤곽선만으로 사용할 수 없습니다.' },
						{
							kind: 'dont',
							caption: '로고 내 일부 요소에 컬러를 변형하여 사용할 수 없습니다.',
						},
						{
							kind: 'dont',
							caption: '로고를 규정 외 컬러로 변형하여 사용할 수 없습니다.',
						},
					],
				},
				{
					category: 'Effect / Background',
					ruleKey: 'logo.background.legibility',
					examples: [
						{
							kind: 'dont',
							caption: '가시성을 해치는 배경 컬러와 함께 사용할 수 없습니다.',
						},
						{
							kind: 'dont',
							caption: '가시성을 해치는 배경 이미지와 함께 사용할 수 없습니다.',
						},
						{ kind: 'dont', caption: '로고에 그라디언트 효과를 적용할 수 없습니다.' },
					],
				},
			],
		},
	},
	{
		slug: 'color-palette',
		colorPalettePage: { page: 24, title: 'Color Palette', ruleKey: 'color.palette' },
	},
	{
		slug: 'color-pairing',
		blocks: [{ page: 25, title: 'Color Pairing', ruleKey: 'color.combination' }],
	},
	{
		slug: 'tone-in-tone',
		blocks: [
			{ page: 26, title: 'Pairing System', ruleKey: 'color.combination.examples' },
			{ page: 27, title: 'Pairing Recommendation (Light)' },
			{ page: 28, title: 'Pairing Recommendation (Dark)' },
		],
	},
	{
		slug: 'tone-on-tone',
		blocks: [{ page: 29, title: 'Pairing System', ruleKey: 'color.combo.tonal.balance' }],
	},
	{ slug: 'mono-tone', blocks: [{ page: 30, title: 'Pairing System', ruleKey: 'color.roles' }] },
	{ slug: 'color-usage', blocks: [{ page: 31, title: 'Color Usage', ruleKey: 'color.usage' }] },
	{
		slug: 'primary-typeface',
		blocks: [
			{ page: 33, title: 'Primary Typeface', ruleKey: 'typography.family' },
			{ page: 34, title: 'AgfaRotis Semi Serif' },
			{ page: 35, title: 'Pretendard' },
		],
	},
	{
		slug: 'micro-typography',
		blocks: [{ page: 36, title: 'Micro Typography', ruleKey: 'typography.pairing' }],
	},
	{
		slug: 'typography-incorrect-usage',
		doDont: {
			title: 'Incorrect Usage',
			page: 37,
			groups: [
				{
					category: 'Spacing',
					ruleKey: 'typography.spacing',
					examples: [
						{ kind: 'dont', caption: '글자 사이 간격을 지나치게 좁힐 수 없습니다.' },
						{ kind: 'dont', caption: '글자 사이 간격을 지나치게 넓힐 수 없습니다.' },
					],
				},
				{
					category: 'Size & Thickness',
					ruleKey: 'typography.weight',
					examples: [
						{
							kind: 'dont',
							caption: '한 문장 안에 각기 다른 굵기를 적용할 수 없습니다.',
						},
						{
							kind: 'dont',
							caption: '한 문장 안에 각기 다른 글자 크기를 적용할 수 없습니다.',
						},
					],
				},
				{
					category: 'Shape & Font',
					ruleKey: 'typography.misuse',
					examples: [
						{ kind: 'dont', caption: '글자의 형태를 변형할 수 없습니다.' },
						{
							kind: 'dont',
							caption: '지정된 서체 이외에 다른 서체를 사용할 수 없습니다.',
						},
					],
				},
			],
		},
	},
	{
		slug: 'essen-flux',
		blocks: [
			{ page: 38, title: 'Essen Flux', ruleKey: 'typography.usage' },
			{ page: 39, title: 'Glyphs' },
		],
		doDont: {
			title: 'Usage Example',
			page: 40,
			groups: [
				{
					category: 'Case',
					ruleKey: 'typography.case',
					examples: [
						{
							kind: 'do',
							caption:
								'타이포그래피는 대·소문자 조합 또는 소문자 조합 방식으로만 운영 가능합니다.',
						},
						{
							kind: 'dont',
							caption:
								'전체 대문자 구성은 서체 고유의 리듬감과 조형 균형을 확보하기 어려우므로 사용을 금지합니다.',
						},
					],
				},
			],
		},
	},
	{
		slug: 'illustration-overview',
		blocks: [{ page: 43, title: 'Illustration', ruleKey: 'illustration.subject.taxonomy' }],
	},
	{
		slug: 'illustration-color-usage',
		blocks: [{ page: 44, title: 'Color Usage', ruleKey: 'illustration.color.usage' }],
	},
	{
		slug: 'illustration-usage-example',
		blocks: [{ page: 45, title: 'Usage Example', ruleKey: 'illustration.style' }],
	},
	{
		slug: 'photography-overview',
		blocks: [
			{ page: 47, title: 'Brand Photography', ruleKey: 'imagery.photography.classification' },
		],
	},
	{
		slug: 'ingredients-texture',
		blocks: [{ page: 48, title: 'Ingredients & Texture', ruleKey: 'imagery.treatment.spec' }],
	},
	{
		slug: 'brand-product',
		blocks: [
			{ page: 49, title: 'Brand Product', ruleKey: 'imagery.composition' },
			{ page: 50, title: 'Brand Product Example' },
		],
	},
	{
		slug: 'brand-model',
		blocks: [{ page: 51, title: 'Brand Model', ruleKey: 'imagery.model.expression' }],
	},
	{
		slug: 'ai-image',
		doDont: {
			title: 'AI Image',
			page: 52,
			groups: [
				{
					category: 'AI Image Consistency',
					ruleKey: 'imagery.ai.consistency',
					examples: [
						{ kind: 'dont', caption: '현실에 존재하지 않는, 비현실적인 피부 표현' },
						{ kind: 'dont', caption: '이미지간 일관되지 않은 톤·대비·연출' },
						{ kind: 'do', caption: '자연스럽고 현실적인 피부 표현' },
						{ kind: 'do', caption: '이미지간 일관된 톤·대비·연출' },
					],
				},
			],
		},
	},
	{
		slug: 'visual-system-overview',
		blocks: [{ page: 54, title: 'Visual System', ruleKey: 'imagery.style' }],
	},
	{
		slug: 'type-a-message',
		blocks: [
			{ page: 55, title: 'Grids & Size Variation', ruleKey: 'layout.visual.template' },
			{ page: 56, title: 'Usage Example' },
		],
	},
	{
		slug: 'type-b-contents',
		blocks: [
			{ page: 57, title: 'Grids & Size Variation', ruleKey: 'grid.visual.system' },
			{ page: 58, title: 'Usage Example' },
		],
	},
	{
		slug: 'sns-contents',
		blocks: [
			{ page: 61, title: 'Overview', ruleKey: 'application.sns.canvas.format' },
			{ page: 67, title: 'Layout System (Feed)' },
			{ page: 68, title: 'Layout System (Reels)' },
			{ page: 69, title: 'Look & Feel' },
		],
	},
	{
		slug: 'brand-contents',
		blocks: [{ page: 62, title: 'Usage Example', ruleKey: 'messaging.sns.copy' }],
	},
	{
		slug: 'product-contents',
		blocks: [{ page: 63, title: 'Usage Example', ruleKey: 'layout.sns.template' }],
	},
	{
		slug: 'communication-contents',
		blocks: [
			{ page: 64, title: 'Usage Example', ruleKey: 'application.content.mix.ratio' },
			{ page: 65, title: 'Influencer Gifting & Interview' },
			{ page: 66, title: 'Events & Etc.' },
		],
	},
	{
		slug: 'online-ad',
		blocks: [
			{ page: 71, title: 'Layout System', ruleKey: 'layout.advertisement.template' },
			{ page: 72, title: 'Usage Example' },
		],
	},
	{
		slug: 'offline-ad-vertical',
		blocks: [
			{ page: 73, title: 'Layout System', ruleKey: 'application.advertisement.format' },
			{ page: 74, title: 'Usage Example' },
		],
	},
	{
		slug: 'offline-ad-horizontal',
		blocks: [
			{ page: 75, title: 'Layout System', ruleKey: 'layout.advertisement.zones' },
			{ page: 76, title: 'Usage Example 1' },
			{ page: 77, title: 'Usage Example 2' },
			{ page: 78, title: 'Usage Example 3' },
		],
	},
	{
		slug: 'business-card',
		blocks: [
			{ page: 80, title: 'Design / Specification', ruleKey: 'application.stationery.format' },
		],
	},
	{
		slug: 'brand-leaflet',
		blocks: [
			{
				page: 81,
				title: 'Design / Specification',
				ruleKey: 'messaging.stationery.content.fields',
			},
			{ page: 82, title: 'Usage Example' },
		],
	},
	{
		slug: 'product-information-card',
		blocks: [
			{
				page: 84,
				title: 'Design / Specification',
				ruleKey: 'application.stationery.spec.scale',
			},
		],
	},
	{
		slug: 'package-overview',
		blocks: [{ page: 86, title: 'Package Box', ruleKey: 'application.package.format' }],
	},
	{
		slug: 'primary-logo-type',
		blocks: [
			{ page: 87, title: 'Vertical Layout', ruleKey: 'logo.package.placement' },
			{ page: 88, title: 'Horizontal Layout' },
			{ page: 89, title: 'Square Layout' },
		],
	},
	{
		slug: 'secondary-logo-type',
		blocks: [
			{ page: 90, title: 'Vertical Layout', ruleKey: 'logo.package.variant' },
			{ page: 91, title: 'Horizontal Layout' },
			{ page: 92, title: 'Square Layout' },
		],
	},
	{
		slug: 'package-box-usage-example',
		blocks: [
			{ page: 93, title: 'Deep Core Hydra Cream', ruleKey: 'application.package.spec.scale' },
			{ page: 95, title: 'Tea Tree Relief Cotton Mask' },
			{ page: 97, title: 'Black Snail Signature Cream' },
		],
	},
	{
		slug: 'product-usage-example',
		blocks: [
			{
				page: 99,
				title: 'Deep Core Hydra Cream',
				ruleKey: 'messaging.package.content.fields',
			},
			{ page: 100, title: 'Tea Tree Relief Cotton Mask' },
			{ page: 101, title: 'Black Snail Signature Cream' },
		],
	},
	{
		slug: 'visual-example',
		mediaPages: [103, 104, 105, 106, 107, 108, 109].map((page) => ({
			page,
			title: `Visual Example ${page - 102}`,
		})),
	},
]

const para = (text: string) => ({
	type: 'paragraph',
	format: '',
	indent: 0,
	version: 1,
	direction: 'ltr',
	textStyle: '',
	textFormat: 0,
	children: [{ mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 }],
})
const rich = (texts: string[]) => ({
	root: {
		type: 'root',
		format: '',
		indent: 0,
		version: 1,
		direction: 'ltr',
		children: texts.map(para),
	},
})

function textForPage(page: number): string[] {
	const text = execFileSync(
		PDFTOTEXT,
		[
			'-layout',
			'-x',
			'0',
			'-y',
			'0',
			'-W',
			'760',
			'-H',
			'1080',
			'-f',
			String(page),
			'-l',
			String(page),
			PDF_PATH,
			'-',
		],
		{ encoding: 'utf8' },
	)
	return text
		.replace(/\f/g, '')
		.split(/\n{2,}/)
		.map((part) =>
			part
				.split('\n')
				.map((line) => line.replace(/\s+/g, ' ').trim())
				.filter(Boolean)
				.filter((line) => !line.startsWith('© Ami Cosmetic'))
				.join('\n'),
		)
		.map((part) => part.trim())
		.filter(Boolean)
}

function renderPage(page: number): string {
	mkdirSync(RENDER_DIR, { recursive: true })
	const prefix = path.join(RENDER_DIR, `page-${page}`)
	const file = `${prefix}.jpg`
	if (existsSync(file)) return file

	execFileSync(PDFTOPPM, [
		'-jpeg',
		'-singlefile',
		'-r',
		'72',
		'-f',
		String(page),
		'-l',
		String(page),
		PDF_PATH,
		prefix,
	])
	return file
}

async function docIdByKey(collection: 'rules', key: string) {
	const result = await payload.find({
		collection,
		depth: 0,
		limit: 1,
		overrideAccess: true,
		where: { key: { equals: key } },
	})
	return (result.docs[0]?.id as number | undefined) ?? null
}

async function pageIdBySlug(slug: string) {
	const result = await payload.find({
		collection: 'guideline-pages',
		depth: 0,
		limit: 1,
		locale: LOCALE,
		fallbackLocale: 'en',
		overrideAccess: true,
		where: { slug: { equals: slug } },
	})
	return (result.docs[0]?.id as number | undefined) ?? null
}

async function colorIds() {
	const result = await payload.find({
		collection: 'brand-colors',
		depth: 0,
		limit: 100,
		locale: LOCALE,
		fallbackLocale: 'en',
		overrideAccess: true,
		sort: 'id',
	})
	return result.docs.map((color) => color.id as number)
}

const ruleIds = new Map<string, number | null>()
const imageIds = new Map<number, Promise<number>>()
async function ruleId(key?: string) {
	if (!key) return undefined
	if (!ruleIds.has(key)) ruleIds.set(key, await docIdByKey('rules', key))
	const id = ruleIds.get(key)
	if (!id) payload.logger.warn(`missing rule: ${key}`)
	return id ?? undefined
}

async function upsertPdfImage(page: number, title: string) {
	if (!imageIds.has(page)) {
		imageIds.set(
			page,
			(async () => {
				const existing = await payload.find({
					collection: 'application-images',
					depth: 0,
					limit: 1,
					locale: LOCALE,
					overrideAccess: true,
					where: { filename: { equals: `page-${page}.jpg` } },
				})
				if (existing.docs[0]) return existing.docs[0].id as number

				const created = await payload.create({
					collection: 'application-images',
					locale: LOCALE,
					overrideAccess: true,
					filePath: renderPage(page),
					data: {
						name: `Brand Guideline Reference p.${page}`,
						alt: `Brand Guideline Reference PDF page ${page}: ${title}`,
						_status: 'published',
					} as never,
				})
				return created.id as number
			})(),
		)
	}
	return imageIds.get(page) as Promise<number>
}

async function columnUnit(defs: PageBlockDef[]) {
	return {
		blockType: 'columnUnit' as const,
		title: defs.map((def) => def.title).join(' / '),
		rule: await ruleId(defs[0]?.ruleKey),
		columns: await Promise.all(
			defs.map(async (def) => ({
				heading: `PDF p.${def.page} · ${def.title}`,
				body: rich(textForPage(def.page)),
				image: await upsertPdfImage(def.page, def.title),
				imageScale: '100',
			})),
		),
	}
}

async function columnBlocks(defs: PageBlockDef[]) {
	if (defs.some((def) => def.ruleKey)) {
		return Promise.all(defs.map((def) => columnUnit([def])))
	}

	const blocks = []
	for (let index = 0; index < defs.length; index += 3) {
		blocks.push(await columnUnit(defs.slice(index, index + 3)))
	}
	return blocks
}

async function doDontBlock(def: DoDontDef) {
	return {
		blockType: 'doDont' as const,
		title: def.title,
		groups: await Promise.all(
			def.groups.map(async (group) => ({
				category: group.category,
				rule: await ruleId(group.ruleKey),
				examples: await Promise.all(
					group.examples.map(async (example) => ({
						...example,
						image: await upsertPdfImage(def.page, `${def.title} - ${group.category}`),
					})),
				),
			})),
		),
	}
}

async function mediaBlocks(defs: PageBlockDef[]) {
	return Promise.all(
		defs.map(async (def) => ({
			blockType: 'mediaShowcase' as const,
			image: await upsertPdfImage(def.page, def.title),
			imageScale: '100',
			rule: await ruleId(def.ruleKey),
		})),
	)
}

async function blocksFor(def: PageDef) {
	const blocks = []
	if ('colorPalettePage' in def) {
		blocks.push({
			blockType: 'colorPalette' as const,
			title: def.colorPalettePage.title,
			colors: await colorIds(),
			rule: await ruleId(def.colorPalettePage.ruleKey),
		})
		blocks.push(...(await columnBlocks([{ ...def.colorPalettePage, ruleKey: undefined }])))
	}
	if ('blocks' in def) blocks.push(...(await columnBlocks(def.blocks)))
	if ('doDont' in def) blocks.push(await doDontBlock(def.doDont))
	if ('mediaPages' in def) blocks.push(...(await mediaBlocks(def.mediaPages)))
	return blocks
}

if (!existsSync(PDF_PATH)) {
	throw new Error(`PDF not found: ${PDF_PATH}`)
}
mkdirSync(RENDER_DIR, { recursive: true })
payload.logger.info(`PDF render cache: ${RENDER_DIR}`)
payload.logger.info(`cached renders: ${readdirSync(RENDER_DIR).length}`)

let updated = 0
for (const def of pages) {
	const id = await pageIdBySlug(def.slug)
	if (!id) {
		payload.logger.warn(`missing guideline page: ${def.slug}`)
		continue
	}
	await payload.update({
		collection: 'guideline-pages',
		id,
		locale: LOCALE,
		overrideAccess: true,
		data: {
			blocks: await blocksFor(def),
			_status: 'published',
		} as never,
	})
	updated += 1
	payload.logger.info(`updated ${def.slug}`)
}

payload.logger.info(`done: updated ${updated} guideline pages`)
process.exit(0)
