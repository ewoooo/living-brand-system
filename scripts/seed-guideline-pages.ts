import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

const sections = [
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
]

for (const section of sections) {
	const sectionDoc = await upsertSection(section)

	for (const page of section.pages) {
		await upsertPage(page, sectionDoc.id)
	}
}

payload.logger.info('Seed guideline pages 완료')

process.exit(0)

async function upsertSection(section: (typeof sections)[number]) {
	const existing = await findBySlug('sections', section.slug, getAliases(section))
	const data = {
		title: section.title,
		slug: section.slug,
		displayOrder: section.order,
		_status: 'published' as const,
	}

	return existing
		? payload.update({
				collection: 'sections',
				id: existing.id,
				data,
				locale: 'ko',
				overrideAccess: true,
			})
		: payload.create({
				collection: 'sections',
				data,
				locale: 'ko',
				overrideAccess: true,
			})
}

async function upsertPage(page: (typeof sections)[number]['pages'][number], sectionId: number) {
	const existing = await findBySlug('guideline-pages', page.slug, getAliases(page))
	const data = {
		title: page.title,
		slug: page.slug,
		displayOrder: page.order,
		section: sectionId,
		_status: 'published' as const,
	}

	return existing
		? payload.update({
				collection: 'guideline-pages',
				id: existing.id,
				data,
				locale: 'ko',
				overrideAccess: true,
			})
		: payload.create({
				collection: 'guideline-pages',
				data,
				locale: 'ko',
				overrideAccess: true,
			})
}

function getAliases(item: object) {
	return 'aliases' in item && Array.isArray(item.aliases) ? item.aliases : []
}

async function findBySlug(
	collection: 'sections' | 'guideline-pages',
	slug: string,
	aliases: readonly string[] = [],
) {
	const result = await payload.find({
		collection,
		locale: 'ko',
		limit: 1,
		overrideAccess: true,
		where: {
			or: [slug, ...aliases].map((value) => ({ slug: { equals: value } })),
		},
	})

	return result.docs[0] ?? null
}
