import config from '@payload-config'
import { getPayload } from 'payload'
import type {
	AgentGuidelineContextRepository,
	AgentGuidelinePage,
	AgentGuidelinePageSummary,
	AgentGuidelineSection,
	GuidelinePageListResult,
	GuidelineSearchInput,
	GuidelineSearchResult,
} from './agent-guideline-context.repository'

type SearchDoc = {
	title?: string | null
	doc?: {
		relationTo?: string | null
		value?: string | number | null
	} | null
}

export class PayloadAgentGuidelineContextRepository implements AgentGuidelineContextRepository {
	constructor(private readonly user: unknown) {}

	async listPages(): Promise<GuidelinePageListResult[]> {
		const payload = await getPayload({ config })
		const [sections, pages] = await Promise.all([
			payload.find({
				collection: 'sections',
				depth: 0,
				draft: false,
				fallbackLocale: 'en',
				limit: 100,
				locale: 'ko',
				overrideAccess: false,
				sort: 'displayOrder',
				user: this.user as never,
				select: {
					title: true,
				},
			}),
			payload.find({
				collection: 'guideline-pages',
				depth: 0,
				draft: false,
				fallbackLocale: 'en',
				limit: 500,
				locale: 'ko',
				overrideAccess: false,
				sort: 'displayOrder',
				user: this.user as never,
				select: {
					title: true,
					section: true,
				},
			}),
		])

		return sections.docs.map((section) => ({
			title: section.title,
			// ponytail: guideline page lists are small; index by section if this grows.
			pages: pages.docs
				.filter((page) => page.section === section.id)
				.map((page) => ({
					id: String(page.id),
					title: page.title,
				})),
		}))
	}

	async search(input: GuidelineSearchInput): Promise<GuidelineSearchResult[]> {
		const query = input.query.trim()

		if (!query) {
			return []
		}

		const payload = await getPayload({ config })
		const results = await payload.find({
			collection: 'search',
			depth: 0,
			limit: 5,
			overrideAccess: false,
			sort: '-priority',
			user: this.user as never,
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

	async findPage(id: string): Promise<AgentGuidelinePage | null> {
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
			user: this.user as never,
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

	async findSection(id: string): Promise<AgentGuidelineSection | null> {
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
			user: this.user as never,
			select: {
				title: true,
				slug: true,
				description: true,
			},
		})
	}

	async listSectionPages(sectionId: number): Promise<AgentGuidelinePageSummary[]> {
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
			user: this.user as never,
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
}
