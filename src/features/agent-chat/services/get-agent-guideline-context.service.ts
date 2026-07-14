import { formatBlockForAgent } from '@/features/guideline/blocks/registry'
import { compact } from '@/features/guideline/utils/block-text'
import { extractTextFromLexical } from '@/features/guideline/utils/lexical-text'
import type { GuidelineDocument } from '@/payload-types'
import {
	type AgentGuidelineDocument,
	type AgentGuidelineListItem,
	type AgentGuidelineSearchResult,
	findAgentChecks,
	findAgentGuidelineDocument,
	listGuidelineDocuments,
	searchGuidelineDocuments,
} from '../repositories/agent-guideline-context.payload.repository'

const MAX_DOCUMENT_CONTENT_LENGTH = 6000

/**
 * Agent가 읽을 수 있는 발행 Check 카탈로그를 조회한다.
 * Payload 조회와 접근 조건은 agent-guideline-context repository가 소유한다.
 */
export function listAgentChecks(user: unknown) {
	return findAgentChecks(user)
}

interface GuidelineSearchInput {
	query: string
}

interface GuidelineDocumentListResult {
	title: string
	pages: {
		id: string
		title: string
	}[]
}

interface GuidelineDocumentInput {
	collection: 'guideline-documents'
	id: string
}

interface GuidelineDocumentResult {
	title: string
	collection: 'guideline-documents'
	id: string
	source: GuidelineDocumentSource
	checks: GuidelineDocumentCheck[]
	content: string
	relatedPages?: GuidelineDocumentRelatedPage[]
}

interface GuidelineDocumentSource {
	collection: 'guideline-documents'
	id: string
	title: string
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
export async function listAgentGuidelinePages(
	user: unknown,
): Promise<GuidelineDocumentListResult[]> {
	const documents = await listGuidelineDocuments(user)
	const children = new Map<number, AgentGuidelineListItem[]>()
	for (const document of documents) {
		const parentId = relationshipId(document.parent)
		if (parentId === null) continue
		children.set(parentId, [...(children.get(parentId) ?? []), document])
	}

	return documents
		.filter((document) => document.breadcrumbs?.length === 2)
		.map((section) => ({
			title: section.title,
			pages: (children.get(section.id) ?? []).map((page) => ({
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
	const result = await findAgentGuidelineDocument(user, input)
	if (!result) return null

	const document = result.document
	const id = String(document.id)
	return {
		title: document.title,
		collection: 'guideline-documents',
		id,
		source: {
			collection: 'guideline-documents',
			id,
			title: document.title,
			href: documentHref(document),
		},
		checks: result.checks.map(toDocumentCheck),
		content: limitContent(formatGuidelineDocument(result)),
		...(result.children.length
			? {
					relatedPages: result.children.map((child) => ({
						id: String(child.id),
						title: child.title,
					})),
				}
			: {}),
	}
}

function formatGuidelineDocument(result: AgentGuidelineDocument): string {
	const document = result.document
	const breadcrumbs = document.breadcrumbs ?? []
	const parentTitle = breadcrumbs.length > 1 ? breadcrumbs.at(-2)?.label : null
	const kind =
		breadcrumbs.length === 1 ? 'Chapter' : breadcrumbs.length === 2 ? 'Section' : 'Page'
	const childSummaries = result.children.map((child) =>
		compact([child.title, extractTextFromLexical(child.description)]).join('\n'),
	)
	const checks = result.checks.map(toDocumentCheck).map(formatCheck)

	return compact([
		parentTitle ? `Parent: ${parentTitle}` : null,
		`${kind}: ${document.title}`,
		extractTextFromLexical(document.description),
		...(document.blocks?.map(formatBlockForAgent).filter(Boolean) ?? []),
		...childSummaries,
		checks.length ? `Checks:\n${checks.join('\n')}` : null,
	]).join('\n\n')
}

function documentHref(document: AgentGuidelineDocument['document']): string | null {
	const breadcrumbs = document.breadcrumbs ?? []
	if (breadcrumbs.length === 3) {
		const sectionURL = breadcrumbs[1]?.url
		return sectionURL ? `${sectionURL}#${document.slug}` : null
	}
	return breadcrumbs.at(-1)?.url ?? null
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

function relationshipId(value: GuidelineDocument['parent']): number | null {
	if (typeof value === 'number') return value
	return value?.id ?? null
}

function limitContent(value: string): string {
	return value.length > MAX_DOCUMENT_CONTENT_LENGTH
		? `${value.slice(0, MAX_DOCUMENT_CONTENT_LENGTH)}...`
		: value
}
