import type { ApplicationImage, GuidelinePage, Rule, Section } from '@/payload-types'
import type {
	AgentGuidelineContextRepository,
	AgentGuidelinePage,
	AgentGuidelinePageSummary,
	AgentGuidelineSection,
	GuidelineDocumentCollection,
	GuidelinePageListResult,
	GuidelineSearchInput,
	GuidelineSearchResult,
} from '@/repositories/agent-guideline-context.repository'

export type {
	GuidelineDocumentCollection,
	GuidelinePageListResult,
	GuidelineSearchInput,
	GuidelineSearchResult,
} from '@/repositories/agent-guideline-context.repository'

const MAX_DOCUMENT_CONTENT_LENGTH = 6000

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
 * Payload Local API 호출과 접근 제어는 AgentGuidelineContextRepository가 담당한다.
 */
export class GetAgentGuidelineContextService implements GetAgentGuidelineContext {
	constructor(private readonly repository: AgentGuidelineContextRepository) {}

	listPages(): Promise<GuidelinePageListResult[]> {
		return this.repository.listPages()
	}

	search(input: GuidelineSearchInput): Promise<GuidelineSearchResult[]> {
		return this.repository.search(input)
	}

	async readDocument(input: GuidelineDocumentInput): Promise<GuidelineDocumentResult | null> {
		if (input.collection === 'sections') {
			return this.readSection(input.id)
		}

		return this.readPage(input.id)
	}

	private async readPage(id: string): Promise<GuidelineDocumentResult | null> {
		const page = await this.repository.findPage(id)

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
		const section = await this.repository.findSection(id)

		if (!section) {
			return null
		}

		const pages = await this.repository.listSectionPages(section.id)

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
