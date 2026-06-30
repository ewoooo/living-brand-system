import config from '@payload-config'
import { getPayload } from 'payload'
import type { GuidelinePage, Section } from '@/payload-types'

type AgentGuidelinePage = Pick<
	GuidelinePage,
	'id' | 'title' | 'slug' | 'description' | 'blocks' | 'rules' | 'section'
>

type AgentGuidelineSection = Pick<Section, 'id' | 'title' | 'slug' | 'description'>

export type AgentGuidelineSectionListItem = Pick<Section, 'id' | 'title'>

export type AgentGuidelinePageListItem = Pick<GuidelinePage, 'id' | 'title' | 'section'>

type AgentGuidelinePageSummary = Pick<GuidelinePage, 'id' | 'title' | 'slug' | 'description'>

export type AgentGuidelineSearchResult = {
	title: string
	collection: string
	id: string
}

export type AgentGuidelineDocument =
	| {
			collection: 'guideline-pages'
			page: AgentGuidelinePage
	  }
	| {
			collection: 'sections'
			section: AgentGuidelineSection
			pages: AgentGuidelinePageSummary[]
	  }

type SearchDoc = {
	title?: string | null
	doc?: {
		relationTo?: string | null
		value?: string | number | null
	} | null
}

export async function listGuidelineSections(
	user: unknown,
): Promise<AgentGuidelineSectionListItem[]> {
	const payload = await getPayload({ config })
	const sections = await payload.find({
		collection: 'sections',
		depth: 0,
		draft: false,
		fallbackLocale: 'en',
		limit: 100,
		locale: 'ko',
		overrideAccess: false,
		sort: 'displayOrder',
		user: user as never,
		select: {
			title: true,
		},
	})

	return sections.docs
}

export async function listGuidelinePageListItems(
	user: unknown,
): Promise<AgentGuidelinePageListItem[]> {
	const payload = await getPayload({ config })
	const pages = await payload.find({
		collection: 'guideline-pages',
		depth: 0,
		draft: false,
		fallbackLocale: 'en',
		limit: 500,
		locale: 'ko',
		overrideAccess: false,
		sort: 'displayOrder',
		user: user as never,
		select: {
			title: true,
			section: true,
		},
	})

	return pages.docs
}

export async function searchGuidelineDocuments(
	user: unknown,
	query: string,
): Promise<AgentGuidelineSearchResult[]> {
	const payload = await getPayload({ config })
	const results = await payload.find({
		collection: 'search',
		depth: 0,
		limit: 5,
		overrideAccess: false,
		sort: '-priority',
		user: user as never,
		where: {
			title: {
				like: query,
			},
		},
	})

	return (results.docs as SearchDoc[])
		.map((result) => ({
			title: result.title || '',
			collection: result.doc?.relationTo || '',
			id: String(result.doc?.value || ''),
		}))
		.filter((result) => result.title && result.collection && result.id)
}

export async function findAgentGuidelineDocument(
	user: unknown,
	input: { collection: 'guideline-pages' | 'sections'; id: string },
): Promise<AgentGuidelineDocument | null> {
	if (input.collection === 'sections') {
		const section = await findGuidelineSection(user, input.id)

		return section
			? {
					collection: 'sections',
					section,
					pages: await listGuidelinePagesBySection(user, section.id),
				}
			: null
	}

	const page = await findGuidelinePage(user, input.id)

	return page ? { collection: 'guideline-pages', page } : null
}

async function findGuidelinePage(user: unknown, id: string): Promise<AgentGuidelinePage | null> {
	const payload = await getPayload({ config })

	return payload.findByID({
		collection: 'guideline-pages',
		id,
		disableErrors: true,
		depth: 1,
		draft: false,
		fallbackLocale: 'en',
		locale: 'ko',
		overrideAccess: false,
		user: user as never,
		select: {
			title: true,
			slug: true,
			description: true,
			blocks: true,
			rules: true,
			section: true,
		},
	})
}

async function findGuidelineSection(
	user: unknown,
	id: string,
): Promise<AgentGuidelineSection | null> {
	const payload = await getPayload({ config })

	return payload.findByID({
		collection: 'sections',
		id,
		disableErrors: true,
		depth: 0,
		draft: false,
		fallbackLocale: 'en',
		locale: 'ko',
		overrideAccess: false,
		user: user as never,
		select: {
			title: true,
			slug: true,
			description: true,
		},
	})
}

async function listGuidelinePagesBySection(
	user: unknown,
	sectionId: number,
): Promise<AgentGuidelinePageSummary[]> {
	const payload = await getPayload({ config })
	const pages = await payload.find({
		collection: 'guideline-pages',
		depth: 0,
		draft: false,
		fallbackLocale: 'en',
		limit: 20,
		locale: 'ko',
		overrideAccess: false,
		sort: 'displayOrder',
		user: user as never,
		where: {
			section: {
				equals: sectionId,
			},
		},
		select: {
			title: true,
			slug: true,
			description: true,
		},
	})

	return pages.docs
}
