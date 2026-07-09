/**
 * Reorganize guideline taxonomy to the reviewed Chapter > Section > Page > Block list.
 *
 * This is intentionally ID-preserving: existing records are updated/moved first,
 * and only missing records are created. Rule links survive because page IDs and
 * block rule IDs are not recreated.
 *
 * Run:
 *   nvm use 22 && pnpm exec payload run scripts/reorganize-guideline-taxonomy.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const LOCALE = 'ko'

type Collection = 'guideline-chapters' | 'guideline-sections' | 'guideline-pages'

interface NodeDef {
	title: string
	slug: string
	fallbackSlugs?: string[]
	children?: NodeDef[]
	blocks?: string[]
}

const taxonomy: NodeDef[] = [
	{
		title: 'Introduction',
		slug: 'introduction',
		children: [
			{
				title: 'Overview',
				slug: 'overview',
				children: [
					{ title: 'Cover', slug: 'cover' },
					{
						title: 'Building Our Brand',
						slug: 'building-our-brand',
						blocks: ['Introduction', 'Instructions'],
					},
					{ title: 'Guidelines Index', slug: 'guidelines-index' },
				],
			},
		],
	},
	{
		title: 'Brand Strategy',
		slug: 'brand-strategy',
		children: [
			{
				title: 'The Name',
				slug: 'the-name',
				fallbackSlugs: ['name'],
				children: [samePage('The Name', 'the-name', ['name'])],
			},
			{
				title: 'The Core',
				slug: 'the-core',
				fallbackSlugs: ['core'],
				children: [samePage('The Core', 'the-core', ['core'])],
			},
			{
				title: 'The Narrative',
				slug: 'the-narrative',
				fallbackSlugs: ['narrative'],
				children: [
					{
						title: 'English Version',
						slug: 'english-version',
						fallbackSlugs: ['narrative'],
					},
					{ title: 'Korean Version', slug: 'korean-version' },
				],
			},
			{
				title: 'The Signature',
				slug: 'the-signature',
				fallbackSlugs: ['signature', 'manifests'],
				children: [samePage('The Signature', 'the-signature', ['signature', 'manifests'])],
			},
		],
	},
	{
		title: 'Brand Design Elements',
		slug: 'brand-design-elements',
		children: [
			{
				title: 'Brand Logo',
				slug: 'brand-logo',
				children: [
					{
						title: 'Primary Logo',
						slug: 'primary-logo',
						blocks: [
							'Design Concept',
							'Minimum Size',
							'Grids & Clear Space',
							'Registered Trademark',
						],
					},
					{
						title: 'Secondary Logo (Vertical Type)',
						slug: 'secondary-logo',
						blocks: ['Minimum Size', 'Grids & Clear Space', 'Registered Trademark'],
					},
					{
						title: 'Service Logo (Horizontal Type)',
						slug: 'service-logo',
						blocks: ['Minimum Size', 'Grids & Clear Space', 'Registered Trademark'],
					},
					{
						title: 'Incorrect Usage',
						slug: 'incorrect-usage',
						blocks: ['Proportion', 'Space', 'Shape', 'Color', 'Effect', 'BG'],
					},
				],
			},
			{
				title: 'Color System',
				slug: 'color-system',
				children: [
					{
						title: 'Color Palette',
						slug: 'color-palette',
						fallbackSlugs: ['color-system'],
						blocks: ['Overview'],
					},
					{ title: 'Color Pairing', slug: 'color-pairing', blocks: ['Overview'] },
					{
						title: 'Tone in Tone',
						slug: 'tone-in-tone',
						blocks: [
							'Pairing System',
							'Pairing Recommendation (Light)',
							'Pairing Recommendation (Dark)',
						],
					},
					{ title: 'Tone on Tone', slug: 'tone-on-tone', blocks: ['Pairing System'] },
					{ title: 'Mono Tone', slug: 'mono-tone', blocks: ['Pairing System'] },
					{ title: 'Color Usage', slug: 'color-usage', blocks: ['Overview'] },
				],
			},
			{
				title: 'Typography',
				slug: 'typography',
				children: [
					{
						title: 'Primary Typeface',
						slug: 'primary-typeface',
						fallbackSlugs: ['typography'],
						blocks: ['Overview', 'English', 'Korean'],
					},
					{
						title: 'Micro Typography',
						slug: 'micro-typography',
						blocks: ['English + Korean'],
					},
					{
						title: 'Incorrect Usage',
						slug: 'typography-incorrect-usage',
						blocks: ['Spacing', 'Size & Thickness', 'Shape & Font'],
					},
					{
						title: 'Signature Typeface: Essen Flux',
						slug: 'essen-flux',
						blocks: ['English', 'Glyphs', 'Usage Example'],
					},
				],
			},
			{
				title: 'Illustration',
				slug: 'illustration',
				children: [
					{
						title: 'Overview',
						slug: 'illustration-overview',
						fallbackSlugs: ['illustration'],
					},
					{
						title: 'Color Usage',
						slug: 'illustration-color-usage',
						fallbackSlugs: ['color-usage'],
					},
					{
						title: 'Usage Example',
						slug: 'illustration-usage-example',
						fallbackSlugs: ['usage-example'],
					},
				],
			},
			{
				title: 'Photography',
				slug: 'photography',
				children: [
					{
						title: 'Overview',
						slug: 'photography-overview',
						fallbackSlugs: ['brand-photography'],
					},
					{ title: 'Ingredients & Texture', slug: 'ingredients-texture' },
					{ title: 'Brand Product', slug: 'brand-product' },
					{ title: 'Brand Model', slug: 'brand-model' },
					{ title: 'AI Image', slug: 'ai-image' },
				],
			},
			{
				title: 'Visual System',
				slug: 'visual-system',
				children: [
					{
						title: 'Overview',
						slug: 'visual-system-overview',
						fallbackSlugs: ['overview'],
					},
					{
						title: 'Type A (Message)',
						slug: 'type-a-message',
						blocks: ['Grids & Size Variation', 'Usage Example'],
					},
					{
						title: 'Type B (Contents)',
						slug: 'type-b-contents',
						blocks: ['Grids & Size Variation', 'Usage Example'],
					},
				],
			},
		],
	},
	{
		title: 'Applications',
		slug: 'applications',
		children: [
			{
				title: 'SNS',
				slug: 'sns',
				fallbackSlugs: ['sns-contents', 'content-guide'],
				children: [
					{
						title: 'SNS Contents',
						slug: 'sns-contents',
						fallbackSlugs: ['content-guide'],
						blocks: [
							'Overview',
							'Layout System (Feed)',
							'Layout System (Reels)',
							'Look & Feel',
						],
					},
					{ title: 'Brand Contents', slug: 'brand-contents', blocks: ['Usage Example'] },
					{
						title: 'Product Contents',
						slug: 'product-contents',
						blocks: ['Usage Example'],
					},
					{
						title: 'Communication Contents',
						slug: 'communication-contents',
						blocks: [
							'Usage Example',
							'Influencer Gifting & Interview',
							'Events & Etc.',
						],
					},
				],
			},
			{
				title: 'AD',
				slug: 'ad',
				children: [
					{
						title: 'Online AD',
						slug: 'online-ad',
						blocks: ['Layout System', 'Usage Example'],
					},
					{
						title: 'Offline AD (Vertical)',
						slug: 'offline-ad-vertical',
						blocks: ['Layout System'],
					},
					{
						title: 'Offline AD (Horizontal)',
						slug: 'offline-ad-horizontal',
						blocks: ['Layout System'],
					},
				],
			},
			{
				title: 'Stationery',
				slug: 'stationery',
				children: [
					{
						title: 'Business Card',
						slug: 'business-card',
						blocks: ['Design', 'Specification'],
					},
					{
						title: 'Brand Leaflet',
						slug: 'brand-leaflet',
						fallbackSlugs: ['envelope'],
						blocks: ['Design', 'Specification'],
					},
					{
						title: 'Product Information Card',
						slug: 'product-information-card',
						blocks: ['Design', 'Specification'],
					},
				],
			},
			{
				title: 'Package',
				slug: 'package',
				fallbackSlugs: ['package-box-primary'],
				children: [
					{ title: 'Overview', slug: 'package-overview' },
					{
						title: 'Primary Logo Type',
						slug: 'primary-logo-type',
						fallbackSlugs: ['package-box-primary'],
						blocks: ['Vertical Layout', 'Horizontal Layout', 'Square Layout'],
					},
					{
						title: 'Secondary Logo Type',
						slug: 'secondary-logo-type',
						fallbackSlugs: ['package-box-secondary'],
						blocks: ['Vertical Layout', 'Horizontal Layout', 'Square Layout'],
					},
					{ title: 'Package Box Usage Example', slug: 'package-box-usage-example' },
					{
						title: 'Product Usage Example',
						slug: 'product-usage-example',
						fallbackSlugs: ['product-packages'],
						blocks: [
							'Deep Core Hydra Cream',
							'Tea Tree Relief Cotton Mask',
							'Black Snail Signature Cream',
						],
					},
				],
			},
			{
				title: 'Etc.',
				slug: 'etc',
				children: [
					{ title: 'Visual Example', slug: 'visual-example', fallbackSlugs: ['etc'] },
				],
			},
		],
	},
]

function samePage(title: string, slug: string, fallbackSlugs?: string[]): NodeDef {
	return { title, slug, fallbackSlugs }
}

function block(title: string) {
	return {
		blockType: 'columnUnit' as const,
		title,
		columns: [{ imageScale: '100' }],
	}
}

async function allDocs(collection: Collection) {
	const result = await payload.find({
		collection,
		depth: 0,
		limit: 1000,
		locale: LOCALE,
		fallbackLocale: 'en',
		draft: false,
		overrideAccess: true,
		sort: 'displayOrder',
	})
	return result.docs
}

function findReusable<T extends { id: number; slug?: string | null; title?: string | null }>(
	docs: T[],
	used: Set<number>,
	def: NodeDef,
) {
	const slugs = [def.slug, ...(def.fallbackSlugs ?? [])]
	return (
		docs.find((doc) => doc.slug && slugs.includes(doc.slug) && !used.has(doc.id)) ??
		docs.find((doc) => doc.title === def.title && !used.has(doc.id))
	)
}

async function upsertChapter(
	def: NodeDef,
	order: number,
	chapters: Awaited<ReturnType<typeof allDocs>>,
	used: Set<number>,
) {
	const existing = findReusable(chapters, used, def)
	if (existing) {
		used.add(existing.id)
		await payload.update({
			collection: 'guideline-chapters',
			id: existing.id,
			locale: LOCALE,
			overrideAccess: true,
			data: {
				title: def.title,
				slug: def.slug,
				displayOrder: order,
				_status: 'published',
			} as never,
		})
		return existing.id
	}
	const created = await payload.create({
		collection: 'guideline-chapters',
		locale: LOCALE,
		overrideAccess: true,
		data: {
			title: def.title,
			slug: def.slug,
			displayOrder: order,
			_status: 'published',
		} as never,
	})
	used.add(created.id as number)
	return created.id as number
}

async function upsertSection(
	def: NodeDef,
	chapter: number,
	order: number,
	sections: Awaited<ReturnType<typeof allDocs>>,
	used: Set<number>,
) {
	const existing = findReusable(sections, used, def)
	if (existing) {
		used.add(existing.id)
		await payload.update({
			collection: 'guideline-sections',
			id: existing.id,
			locale: LOCALE,
			overrideAccess: true,
			data: {
				title: def.title,
				slug: def.slug,
				chapter,
				displayOrder: order,
				_status: 'published',
			} as never,
		})
		return existing.id
	}
	const created = await payload.create({
		collection: 'guideline-sections',
		locale: LOCALE,
		overrideAccess: true,
		data: {
			title: def.title,
			slug: def.slug,
			chapter,
			displayOrder: order,
			_status: 'published',
		} as never,
	})
	used.add(created.id as number)
	return created.id as number
}

async function upsertPage(
	def: NodeDef,
	section: number,
	order: number,
	pages: Awaited<ReturnType<typeof allDocs>>,
	used: Set<number>,
) {
	const existing = findReusable(pages, used, def)
	const data = {
		title: def.title,
		slug: def.slug,
		section,
		displayOrder: order,
		_status: 'published',
	} as Record<string, unknown>

	if (existing) {
		used.add(existing.id)
		const existingPage = existing as { blocks?: unknown }
		if (def.blocks && !hasAnyBlocks(existingPage)) data.blocks = def.blocks.map(block)
		if (def.slug === 'incorrect-usage')
			data.blocks = await splitIncorrectUsage(existingPage.blocks)
		await payload.update({
			collection: 'guideline-pages',
			id: existing.id,
			locale: LOCALE,
			overrideAccess: true,
			data: data as never,
		})
		return existing.id
	}

	const created = await payload.create({
		collection: 'guideline-pages',
		locale: LOCALE,
		overrideAccess: true,
		data: {
			...data,
			blocks: def.blocks?.map(block) ?? [],
		} as never,
	})
	used.add(created.id as number)
	return created.id as number
}

function hasAnyBlocks(page: unknown) {
	return (
		typeof page === 'object' &&
		page !== null &&
		'blocks' in page &&
		Array.isArray((page as { blocks?: unknown }).blocks) &&
		(page as { blocks: unknown[] }).blocks.length > 0
	)
}

async function ruleId(key: string) {
	const result = await payload.find({
		collection: 'rules',
		depth: 0,
		limit: 1,
		overrideAccess: true,
		where: { key: { equals: key } },
	})
	return (result.docs[0]?.id as number | undefined) ?? null
}

async function splitIncorrectUsage(blocks: unknown) {
	const existing = Array.isArray(blocks)
		? blocks.find(
				(item) =>
					typeof item === 'object' &&
					item !== null &&
					'blockType' in item &&
					item.blockType === 'doDont',
			)
		: null

	if (
		!existing ||
		typeof existing !== 'object' ||
		!('groups' in existing) ||
		!Array.isArray(existing.groups)
	) {
		return [
			{
				blockType: 'doDont' as const,
				title: 'Incorrect Usage',
				groups: await fallbackIncorrectUsageGroups(),
			},
		]
	}

	const byCategory = new Map<string, { rule?: number | null; examples?: unknown[] }>()
	for (const group of existing.groups) {
		if (typeof group !== 'object' || group === null) continue
		const category =
			'category' in group && typeof group.category === 'string' ? group.category : ''
		byCategory.set(category, {
			rule: 'rule' in group && typeof group.rule === 'number' ? group.rule : null,
			examples: 'examples' in group && Array.isArray(group.examples) ? group.examples : [],
		})
	}

	if (['Proportion', 'Space', 'Effect', 'BG'].some((category) => byCategory.has(category))) {
		const fallback = await fallbackIncorrectUsageGroups()
		const groups = fallback.map((group) => {
			const current = byCategory.get(group.category)
			return {
				...group,
				rule: current?.rule ?? group.rule,
				examples: current?.examples?.length ? current.examples : group.examples,
			}
		})
		return [{ blockType: 'doDont' as const, title: 'Incorrect Usage', groups }]
	}

	const geometry = byCategory.get('Proportion / Space')
	const effect = byCategory.get('Effect / Background')
	const groups = [
		{
			category: 'Proportion',
			rule: geometry?.rule,
			examples: (geometry?.examples ?? []).filter((example) =>
				captionIncludes(example, ['비례', '기울기']),
			),
		},
		{
			category: 'Space',
			rule: geometry?.rule,
			examples: (geometry?.examples ?? []).filter((example) =>
				captionIncludes(example, ['간격']),
			),
		},
		{
			category: 'Shape',
			rule: byCategory.get('Shape')?.rule,
			examples: byCategory.get('Shape')?.examples ?? [],
		},
		{
			category: 'Color',
			rule: byCategory.get('Color')?.rule,
			examples: byCategory.get('Color')?.examples ?? [],
		},
		{
			category: 'Effect',
			rule: effect?.rule,
			examples: (effect?.examples ?? []).filter((example) =>
				captionIncludes(example, ['그라디언트']),
			),
		},
		{
			category: 'BG',
			rule: effect?.rule,
			examples: (effect?.examples ?? []).filter((example) =>
				captionIncludes(example, ['배경']),
			),
		},
	].map((group) => ({
		...group,
		examples:
			group.examples.length > 0
				? group.examples
				: [{ kind: 'dont', caption: `${group.category} usage rule` }],
	}))

	return [{ blockType: 'doDont' as const, title: 'Incorrect Usage', groups }]
}

async function fallbackIncorrectUsageGroups() {
	const [geometry, misuse, color, background] = await Promise.all([
		ruleId('logo.geometry'),
		ruleId('logo.misuse'),
		ruleId('logo.color.misuse'),
		ruleId('logo.background.legibility'),
	])
	return [
		{
			category: 'Proportion',
			rule: geometry,
			examples: [
				{ kind: 'dont', caption: '로고의 비례를 임의로 변형하여 사용할 수 없습니다.' },
			],
		},
		{
			category: 'Space',
			rule: geometry,
			examples: [{ kind: 'dont', caption: '로고의 간격을 임의로 조정할 수 없습니다.' }],
		},
		{
			category: 'Shape',
			rule: misuse,
			examples: [
				{ kind: 'dont', caption: '로고의 형태를 임의로 변형하여 사용할 수 없습니다.' },
			],
		},
		{
			category: 'Color',
			rule: color,
			examples: [
				{ kind: 'dont', caption: '로고를 규정 외 컬러로 변형하여 사용할 수 없습니다.' },
			],
		},
		{
			category: 'Effect',
			rule: background,
			examples: [{ kind: 'dont', caption: '로고에 그라디언트 효과를 적용할 수 없습니다.' }],
		},
		{
			category: 'BG',
			rule: background,
			examples: [
				{ kind: 'dont', caption: '가시성을 해치는 배경과 함께 사용할 수 없습니다.' },
			],
		},
	]
}

function captionIncludes(example: unknown, needles: string[]) {
	if (
		typeof example !== 'object' ||
		example === null ||
		!('caption' in example) ||
		typeof example.caption !== 'string'
	) {
		return false
	}
	const caption = example.caption
	return needles.some((needle) => caption.includes(needle))
}

async function deleteUnused(collection: Collection, used: Set<number>) {
	const docs = await allDocs(collection)
	for (const doc of docs) {
		if (used.has(doc.id)) continue
		if (collection === 'guideline-pages' && hasAnyRules(doc)) continue
		await payload.delete({ collection, id: doc.id, overrideAccess: true })
	}
}

function hasAnyRules(page: unknown) {
	if (typeof page !== 'object' || page === null) return false
	const rules = 'rules' in page && Array.isArray(page.rules) ? page.rules : []
	const blocks = 'blocks' in page && Array.isArray(page.blocks) ? page.blocks : []
	return (
		rules.length > 0 ||
		blocks.some((item) => {
			if (typeof item !== 'object' || item === null) return false
			if ('rule' in item && item.rule) return true
			if ('groups' in item && Array.isArray(item.groups)) {
				return item.groups.some(
					(group: unknown) =>
						typeof group === 'object' &&
						group !== null &&
						'rule' in group &&
						group.rule,
				)
			}
			return false
		})
	)
}

const chapters = await allDocs('guideline-chapters')
const sections = await allDocs('guideline-sections')
const pages = await allDocs('guideline-pages')
const usedChapters = new Set<number>()
const usedSections = new Set<number>()
const usedPages = new Set<number>()

for (const [chapterOrder, chapter] of taxonomy.entries()) {
	const chapterId = await upsertChapter(chapter, chapterOrder, chapters, usedChapters)
	for (const [sectionOrder, section] of (chapter.children ?? []).entries()) {
		const sectionId = await upsertSection(
			section,
			chapterId,
			sectionOrder,
			sections,
			usedSections,
		)
		for (const [pageOrder, page] of (section.children ?? []).entries()) {
			await upsertPage(page, sectionId, pageOrder, pages, usedPages)
		}
	}
}

await deleteUnused('guideline-pages', usedPages)
await deleteUnused('guideline-sections', usedSections)
await deleteUnused('guideline-chapters', usedChapters)

payload.logger.info(
	`done: ${usedChapters.size} chapters, ${usedSections.size} sections, ${usedPages.size} pages`,
)
process.exit(0)
