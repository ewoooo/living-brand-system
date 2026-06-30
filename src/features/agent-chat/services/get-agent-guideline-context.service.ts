import config from '@payload-config'
import { getPayload } from 'payload'
import type { ApplicationImage, GuidelinePage, Rule, Section } from '@/payload-types'

const MAX_DOCUMENT_CONTENT_LENGTH = 6000

export interface GuidelineSearchInput {
	query: string
}

export type GuidelineDocumentCollection = 'guideline-pages' | 'sections'

export interface GuidelineSearchResult {
	title: string
	collection: string
	id: string
}

export interface GuidelinePageListResult {
	title: string
	pages: {
		id: string
		title: string
	}[]
}

export interface GuidelineDocumentInput {
	collection: GuidelineDocumentCollection
	id: string
}

export interface GuidelineDocumentResult {
	title: string
	collection: GuidelineDocumentCollection
	id: string
	content: string
	relatedPages?: {
		id: string
		title: string
	}[]
}

export interface GetAgentGuidelineContext {
	listPages(): Promise<GuidelinePageListResult[]>
	search(input: GuidelineSearchInput): Promise<GuidelineSearchResult[]>
	readDocument(input: GuidelineDocumentInput): Promise<GuidelineDocumentResult | null>
}

/**
 * Agent tool은 published guideline을 목록, 검색 결과, LLM용 본문으로 조립한다.
 * Payload Local API 호출과 접근 제어는 이 파일 하단의 Payload helper가 담당한다.
 */
export class GetAgentGuidelineContextService implements GetAgentGuidelineContext {
	constructor(private readonly user: unknown) {}

	listPages(): Promise<GuidelinePageListResult[]> {
		return listPages(this.user)
	}

	search(input: GuidelineSearchInput): Promise<GuidelineSearchResult[]> {
		return searchGuidelines(this.user, input)
	}

	async readDocument(input: GuidelineDocumentInput): Promise<GuidelineDocumentResult | null> {
		if (input.collection === 'sections') {
			return this.readSection(input.id)
		}

		return this.readPage(input.id)
	}

	private async readPage(id: string): Promise<GuidelineDocumentResult | null> {
		const page = await findPage(this.user, id)

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
		const section = await findSection(this.user, id)

		if (!section) {
			return null
		}

		const pages = await listSectionPages(this.user, section.id)

		return {
			title: section.title,
			collection: 'sections',
			id: String(section.id),
			content: limitContent(formatGuidelineSection(section, pages)),
			relatedPages: pages.map((page) => ({
				id: String(page.id),
				title: page.title,
			})),
		}
	}
}

type AgentGuidelinePage = Pick<
	GuidelinePage,
	'id' | 'title' | 'slug' | 'description' | 'blocks' | 'rules' | 'section'
>

type AgentGuidelineSection = Pick<Section, 'id' | 'title' | 'slug' | 'description'>

type AgentGuidelinePageSummary = Pick<GuidelinePage, 'id' | 'title' | 'slug' | 'description'>

type SearchDoc = {
	title?: string | null
	doc?: {
		relationTo?: string | null
		value?: string | number | null
	} | null
}

async function listPages(user: unknown): Promise<GuidelinePageListResult[]> {
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
			user: user as never,
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
			user: user as never,
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

async function searchGuidelines(
	user: unknown,
	input: GuidelineSearchInput,
): Promise<GuidelineSearchResult[]> {
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

async function findPage(user: unknown, id: string): Promise<AgentGuidelinePage | null> {
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

async function findSection(user: unknown, id: string): Promise<AgentGuidelineSection | null> {
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

async function listSectionPages(
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

function formatGuidelineSection(
	section: AgentGuidelineSection,
	pages: AgentGuidelinePageSummary[],
): string {
	const pageSummaries = pages.map((page) =>
		compact([page.title, extractTextFromLexical(page.description)]).join('\n'),
	)

	return compact([section.title, section.description, ...pageSummaries]).join('\n\n')
}

function formatGuidelinePage(page: AgentGuidelinePage): string {
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
