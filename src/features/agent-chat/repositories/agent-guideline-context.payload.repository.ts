import config from '@payload-config'
import { getPayload } from 'payload'
import { collectGuidelineCheckSources } from '@/features/guideline/checks/collect-guideline-check-sources'
import { findPublishedGuidelineCheckDocuments } from '@/features/guideline/repositories/published-guideline-checks.payload.repository'
import type { GuidelinePage, GuidelineSection } from '@/payload-types'

type AgentGuidelinePage = Pick<
	GuidelinePage,
	'id' | 'title' | 'slug' | 'description' | 'blocks' | 'checks' | 'section'
>

type AgentGuidelineSection = Pick<
	GuidelineSection,
	'id' | 'title' | 'slug' | 'description' | 'headerImage' | 'blocks' | 'checks'
>

type AgentGuidelineSectionListItem = Pick<GuidelineSection, 'id' | 'title'>

type AgentGuidelinePageListItem = Pick<GuidelinePage, 'id' | 'title' | 'section'>

type AgentGuidelinePageSummary = Pick<GuidelinePage, 'id' | 'title' | 'slug' | 'description'>

export interface AgentCheckCatalogItem {
	evidence: string
	key: string
	tier: 'recommended' | 'required' | null
	title: string
}

export type AgentGuidelineSearchResult = {
	title: string
	collection: string
	id: string
}

export type AgentGuidelineDocument =
	| {
			collection: 'guideline-pages'
			page: AgentGuidelinePage
			checks: AgentCheckCatalogItem[]
	  }
	| {
			collection: 'guideline-sections'
			section: AgentGuidelineSection
			pages: AgentGuidelinePageSummary[]
			checks: AgentCheckCatalogItem[]
	  }

type SearchDoc = {
	title?: string | null
	doc?: {
		relationTo?: string | null
		value?: string | number | null
	} | null
}

/** published+ko(en fallback)+접근제어 공통 조회 옵션 — 이 repo의 가이드라인 질의 전부가 쓴다. */
const publishedKoQuery = (user: unknown) => ({
	draft: false,
	fallbackLocale: 'en' as const,
	locale: 'ko' as const,
	overrideAccess: false,
	user: user as never,
})

export async function listGuidelineSections(
	user: unknown,
): Promise<AgentGuidelineSectionListItem[]> {
	const payload = await getPayload({ config })
	const sections = await payload.find({
		...publishedKoQuery(user),
		collection: 'guideline-sections',
		depth: 0,
		limit: 100,
		sort: 'displayOrder',
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
		...publishedKoQuery(user),
		collection: 'guideline-pages',
		depth: 0,
		limit: 500,
		sort: 'displayOrder',
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

export async function findAgentChecks(user: unknown): Promise<AgentCheckCatalogItem[]> {
	const payload = await getPayload({ config })
	const { sections, pages } = await findPublishedGuidelineCheckDocuments(payload, {
		overrideAccess: false,
		user,
	})

	return [...sections, ...pages]
		.flatMap(collectGuidelineCheckSources)
		.map(({ check, evidence }) => ({
			evidence,
			key: check.key,
			tier: check.tier ?? null,
			title: check.title,
		}))
		.sort((a, b) => a.key.localeCompare(b.key))
}

export async function findAgentGuidelineDocument(
	user: unknown,
	input: { collection: 'guideline-pages' | 'guideline-sections'; id: string },
): Promise<AgentGuidelineDocument | null> {
	if (input.collection === 'guideline-sections') {
		const section = await findGuidelineSection(user, input.id)

		return section
			? {
					collection: 'guideline-sections',
					section,
					pages: await listGuidelinePagesBySection(user, section.id),
					checks: collectGuidelineCheckSources(section).map(toAgentCheck),
				}
			: null
	}

	const page = await findGuidelinePage(user, input.id)

	return page
		? {
				collection: 'guideline-pages',
				page,
				checks: collectGuidelineCheckSources(page).map(toAgentCheck),
			}
		: null
}

async function findGuidelinePage(user: unknown, id: string): Promise<AgentGuidelinePage | null> {
	const payload = await getPayload({ config })

	return payload.findByID({
		...publishedKoQuery(user),
		collection: 'guideline-pages',
		id,
		disableErrors: true,
		depth: 1,
		select: {
			title: true,
			slug: true,
			description: true,
			blocks: true,
			checks: true,
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
		...publishedKoQuery(user),
		collection: 'guideline-sections',
		id,
		disableErrors: true,
		depth: 1,
		select: {
			title: true,
			slug: true,
			description: true,
			headerImage: true,
			blocks: true,
			checks: true,
		},
	})
}

async function listGuidelinePagesBySection(
	user: unknown,
	sectionId: number,
): Promise<AgentGuidelinePageSummary[]> {
	const payload = await getPayload({ config })
	const pages = await payload.find({
		...publishedKoQuery(user),
		collection: 'guideline-pages',
		depth: 0,
		limit: 20,
		sort: 'displayOrder',
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

function toAgentCheck({
	check,
	evidence,
}: ReturnType<typeof collectGuidelineCheckSources>[number]): AgentCheckCatalogItem {
	return {
		evidence,
		key: check.key,
		tier: check.tier ?? null,
		title: check.title,
	}
}
