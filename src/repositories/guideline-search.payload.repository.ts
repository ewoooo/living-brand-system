import config from '@payload-config'
import { getPayload } from 'payload'

import type { ApplicationImage, GuidelinePage, Rule, Section } from '@/payload-types'
import type {
	GuidelineDocumentInput,
	GuidelineDocumentResult,
	GuidelinePageListResult,
	GuidelineSearchInput,
	GuidelineSearchRepository,
	GuidelineSearchResult,
} from './guideline-search.repository'

const MAX_DOCUMENT_CONTENT_LENGTH = 6000

type SearchDoc = {
	title?: string | null
	doc?: {
		relationTo?: string | null
		value?: string | number | null
	} | null
}
type GuidelinePageForAgent = Pick<
	GuidelinePage,
	'id' | 'title' | 'slug' | 'description' | 'blocks' | 'rules' | 'section'
>

/**
 * Agent tool의 published guideline 검색을 Payload search collection으로 수행한다.
 * 접근 제어는 Payload Local API가 user와 overrideAccess 설정으로 강제한다.
 */
export class PayloadGuidelineSearchRepository implements GuidelineSearchRepository {
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

	async readDocument(input: GuidelineDocumentInput): Promise<GuidelineDocumentResult | null> {
		if (input.collection === 'sections') {
			return this.readSection(input.id)
		}

		return this.readPage(input.id)
	}

	private async readPage(id: string): Promise<GuidelineDocumentResult | null> {
		const payload = await getPayload({ config })
		const page = await payload.findByID({
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

		if (!page) {
			return null
		}

		return {
			title: page.title,
			collection: 'guideline-pages',
			id: String(page.id),
			content: limitContent(formatGuidelinePage(page)),
		}
	}

	private async readSection(id: string): Promise<GuidelineDocumentResult | null> {
		const payload = await getPayload({ config })
		const section = await payload.findByID({
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

		if (!section) {
			return null
		}

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
					equals: section.id,
				},
			},
			select: {
				title: true,
				slug: true,
				description: true,
			},
		})
		const pageSummaries = pages.docs.map((page) =>
			compact([page.title, extractTextFromLexical(page.description)]).join('\n'),
		)

		return {
			title: section.title,
			collection: 'sections',
			id: String(section.id),
			content: limitContent(
				compact([section.title, section.description, ...pageSummaries]).join('\n\n'),
			),
			relatedPages: pages.docs.map((page) => ({
				id: String(page.id),
				title: page.title,
			})),
		}
	}
}

function formatGuidelinePage(page: GuidelinePageForAgent): string {
	const sectionTitle = getTitle(page.section)
	const rules = page.rules?.map(formatRule).filter(Boolean) ?? []

	return compact([
		sectionTitle ? `Section: ${sectionTitle}` : null,
		`Page: ${page.title}`,
		extractTextFromLexical(page.description),
		...(page.blocks?.map(formatBlock).filter(Boolean) ?? []),
		rules.length ? `Rules:\n${rules.join('\n')}` : null,
	]).join('\n\n')
}

function formatBlock(block: NonNullable<GuidelinePage['blocks']>[number]): string {
	if (block.blockType === 'mediaShowcase') {
		return compact(['Media showcase', formatImage(block.image)]).join('\n')
	}

	return compact([
		block.title,
		...(block.columns?.map((column) =>
			compact([
				column.heading,
				extractTextFromLexical(column.body),
				formatImage(column.image),
			]).join('\n'),
		) ?? []),
	]).join('\n\n')
}

function formatRule(value: number | Rule): string {
	return typeof value === 'object' ? `- ${value.key}: ${value.title}` : ''
}

function formatImage(value: unknown): string {
	if (!value || typeof value !== 'object') {
		return ''
	}

	const image = value as Partial<ApplicationImage>
	return compact([image.alt, image.name, image.url]).join(' ')
}

function getTitle(value: number | Section): string {
	return typeof value === 'object' ? value.title : ''
}

export function extractTextFromLexical(value: unknown): string {
	return collectText(value).join(' ').replace(/\s+/g, ' ').trim()
}

function collectText(value: unknown): string[] {
	if (!value || typeof value !== 'object') {
		return []
	}

	if (Array.isArray(value)) {
		return value.flatMap(collectText)
	}

	const node = value as { children?: unknown; root?: unknown; text?: unknown }

	return [
		typeof node.text === 'string' ? node.text : null,
		...(node.root ? collectText(node.root) : []),
		...(Array.isArray(node.children) ? collectText(node.children) : []),
	].filter((item): item is string => Boolean(item))
}

function compact(values: (string | null | undefined)[]): string[] {
	return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))
}

function limitContent(value: string): string {
	return value.length > MAX_DOCUMENT_CONTENT_LENGTH
		? `${value.slice(0, MAX_DOCUMENT_CONTENT_LENGTH)}...`
		: value
}
