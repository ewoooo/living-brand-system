import { formatBlockForAgent } from '@/features/guideline/blocks/registry'
import { extractTextFromLexical } from '@/features/guideline/utils/lexical-text'
import type { GuidelineSection } from '@/payload-types'
import {
	type AgentGuidelineDocument,
	type AgentGuidelineSearchResult,
	findAgentGuidelineDocument,
	listGuidelinePageListItems,
	listGuidelineSections,
	searchGuidelineDocuments,
} from '../repositories/agent-guideline-context.payload.repository'

const MAX_DOCUMENT_CONTENT_LENGTH = 6000

interface GuidelineSearchInput {
	query: string
}

type GuidelineDocumentCollection = 'guideline-pages' | 'guideline-sections'

interface GuidelinePageListResult {
	title: string
	pages: {
		id: string
		title: string
	}[]
}

interface GuidelineDocumentInput {
	collection: GuidelineDocumentCollection
	id: string
}

interface GuidelineDocumentResult {
	title: string
	collection: GuidelineDocumentCollection
	id: string
	source: GuidelineDocumentSource
	checks: GuidelineDocumentCheck[]
	content: string
	relatedPages?: GuidelineDocumentRelatedPage[]
}

interface GuidelineDocumentSource {
	collection: GuidelineDocumentCollection
	id: string
	title: string
	/** 발행 가이드라인 화면 경로 (/guideline/{sectionSlug}#{pageSlug}). slug 미발행 시 null. */
	href: string | null
}

interface GuidelineDocumentCheck {
	key: string
	title: string
}

/**
 * Agent tool에 제공할 published guideline 페이지 목록을 조립한다.
 * Payload Local API 호출과 접근 제어는 agent guideline context repository가 담당한다.
 */
export async function listAgentGuidelinePages(user: unknown): Promise<GuidelinePageListResult[]> {
	const [sections, pages] = await Promise.all([
		listGuidelineSections(user),
		listGuidelinePageListItems(user),
	])

	return sections.map((section) => ({
		title: section.title,
		// ponytail: guideline page lists are small; index by section if this grows.
		pages: pages
			.filter((page) => page.section === section.id)
			.map((page) => ({
				id: String(page.id),
				title: page.title,
			})),
	}))
}

/**
 * Agent tool의 guideline 검색 요청을 정리해 repository 검색으로 넘긴다.
 * Payload 검색 I/O는 agent guideline context repository가 담당한다.
 */
export function searchAgentGuidelines(
	user: unknown,
	input: GuidelineSearchInput,
): Promise<AgentGuidelineSearchResult[]> {
	const query = input.query.trim()

	return query ? searchGuidelineDocuments(user, query) : Promise.resolve([])
}

/**
 * Agent tool이 읽은 guideline 문서를 LLM용 본문으로 변환한다.
 * Payload 문서 조회는 agent guideline context repository가 담당한다.
 */
export async function readAgentGuidelineDocument(
	user: unknown,
	input: GuidelineDocumentInput,
): Promise<GuidelineDocumentResult | null> {
	const document = await findAgentGuidelineDocument(user, input)

	if (!document) {
		return null
	}

	return document.collection === 'guideline-pages'
		? formatGuidelinePageResult(document)
		: formatGuidelineSectionResult(document)
}

function formatGuidelineSection(
	section: Extract<AgentGuidelineDocument, { collection: 'guideline-sections' }>['section'],
	pages: Extract<AgentGuidelineDocument, { collection: 'guideline-sections' }>['pages'],
): string {
	const pageSummaries = pages.map((page) =>
		compact([page.title, extractTextFromLexical(page.description)]).join('\n'),
	)

	return compact([section.title, section.description, ...pageSummaries]).join('\n\n')
}

function formatGuidelinePageResult(
	document: Extract<AgentGuidelineDocument, { collection: 'guideline-pages' }>,
): GuidelineDocumentResult {
	const id = String(document.page.id)
	const sectionSlug = getSectionSlug(document.page.section)

	return {
		title: document.page.title,
		collection: 'guideline-pages',
		id,
		source: {
			collection: 'guideline-pages',
			id,
			title: document.page.title,
			href:
				sectionSlug && document.page.slug
					? `/guideline/${sectionSlug}#${document.page.slug}`
					: null,
		},
		checks: document.checks.map(toDocumentCheck),
		content: limitContent(formatGuidelinePage(document.page, document.checks)),
	}
}

function formatGuidelineSectionResult(
	document: Extract<AgentGuidelineDocument, { collection: 'guideline-sections' }>,
): GuidelineDocumentResult {
	const id = String(document.section.id)

	return {
		title: document.section.title,
		collection: 'guideline-sections',
		id,
		source: {
			collection: 'guideline-sections',
			id,
			title: document.section.title,
			href: document.section.slug ? `/guideline/${document.section.slug}` : null,
		},
		checks: document.checks.map(toDocumentCheck),
		content: limitContent(formatGuidelineSection(document.section, document.pages)),
		relatedPages: document.pages.map((page) => ({
			id: String(page.id),
			title: page.title,
		})),
	}
}

function formatGuidelinePage(
	page: Extract<AgentGuidelineDocument, { collection: 'guideline-pages' }>['page'],
	documentChecks: Extract<AgentGuidelineDocument, { collection: 'guideline-pages' }>['checks'],
): string {
	const sectionTitle = getTitle(page.section)
	const checks = documentChecks.map(toDocumentCheck).map(formatCheck)

	return compact([
		sectionTitle ? `Section: ${sectionTitle}` : null,
		`Page: ${page.title}`,
		extractTextFromLexical(page.description),
		...(page.blocks?.map(formatBlockForAgent).filter(Boolean) ?? []),
		checks.length ? `Checks:\n${checks.join('\n')}` : null,
	]).join('\n\n')
}

type GuidelineDocumentRelatedPage = {
	id: string
	title: string
}

function formatCheck(value: GuidelineDocumentCheck): string {
	return `- ${value.key}: ${value.title}`
}

function toDocumentCheck(check: { key: string; title: string }): GuidelineDocumentCheck {
	return { key: check.key, title: check.title }
}

function getTitle(value: number | GuidelineSection): string {
	return typeof value === 'object' ? value.title : ''
}

function getSectionSlug(value: number | GuidelineSection): string | null {
	return typeof value === 'object' ? (value.slug ?? null) : null
}

function compact(values: (string | null | undefined)[]): string[] {
	return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))
}

function limitContent(value: string): string {
	return value.length > MAX_DOCUMENT_CONTENT_LENGTH
		? `${value.slice(0, MAX_DOCUMENT_CONTENT_LENGTH)}...`
		: value
}
