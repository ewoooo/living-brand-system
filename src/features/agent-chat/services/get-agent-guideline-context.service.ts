import { formatBlockForAgent } from '@/features/guideline/blocks/runtime/project-guideline-block'
import { collectGuidelineCheckSources } from '@/features/guideline/checks/collect-guideline-check-sources'
import { formatCheckEvidence } from '@/features/guideline/checks/format-check-evidence'
import { compact } from '@/features/guideline/utils/block-text'
import {
	type AgentGuidelineDocument,
	type AgentGuidelineSearchCandidate,
	findAgentCheckDocuments,
	findAgentGuidelineDocument,
	findGuidelineSearchPhraseCandidates,
	findGuidelineSearchTermCandidates,
	listGuidelineDocuments,
} from '../repositories/agent-guideline-context.payload.repository'

const MAX_DOCUMENT_CONTENT_LENGTH = 6000
const SEARCH_RESULT_LIMIT = 10
const SEARCH_TERM_LIMIT = 8

export interface AgentCheckCatalogItem {
	evidence: string
	key: string
	tier: 'recommended' | 'required' | null
	title: string
}

export type AgentGuidelineSearchResult = {
	title: string
	collection: 'guideline-documents'
	id: string
}

/**
 * Agent가 읽을 수 있는 발행 Check 카탈로그를 조립한다.
 * Payload 문서 조회는 agent-guideline-context repository가 소유한다.
 */
export async function listAgentChecks(user: unknown): Promise<AgentCheckCatalogItem[]> {
	const documents = await findAgentCheckDocuments(user)

	return documents
		.flatMap(collectGuidelineCheckSources)
		.map(toAgentCheck)
		.sort((a, b) => a.key.localeCompare(b.key))
}

interface GuidelineSearchInput {
	query: string
}

interface GuidelineDocumentListResult {
	collection: 'guideline-documents'
	id: string
	level: number
	parentId: string | null
	title: string
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
	relatedDocuments?: GuidelineDocumentRelatedDocument[]
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
 * Agent tool에 제공할 published guideline 문서 목록을 조립한다.
 * Payload Local API 호출과 접근 제어는 agent guideline context repository가 담당한다.
 */
export async function listAgentGuidelineDocuments(
	user: unknown,
): Promise<GuidelineDocumentListResult[]> {
	const documents = await listGuidelineDocuments(user)
	return documents.map((document) => ({
		collection: 'guideline-documents',
		id: String(document.id),
		level: document.level,
		parentId: document.parentId?.toString() ?? null,
		title: document.title,
	}))
}

/**
 * Agent tool의 guideline 검색 후보를 보강·중복 제거·순위화한다.
 * Payload 후보 조회와 DTO 변환은 agent guideline context repository가 담당한다.
 */
export async function searchAgentGuidelines(
	user: unknown,
	input: GuidelineSearchInput,
): Promise<AgentGuidelineSearchResult[]> {
	const query = input.query.trim()
	if (!query) return []

	const terms = searchTerms(query)
	const phraseCandidates = await findGuidelineSearchPhraseCandidates(user, query)
	const candidates =
		phraseCandidates.length < SEARCH_RESULT_LIMIT
			? dedupeSearchCandidates([
					...phraseCandidates,
					...(await findGuidelineSearchTermCandidates(user, terms)),
				])
			: phraseCandidates

	return candidates
		.filter((candidate) => candidate.collection === 'guideline-documents')
		.map((candidate) => ({
			title: candidate.title,
			collection: 'guideline-documents' as const,
			id: candidate.id,
		}))
		.filter((result) => result.title && result.id)
		.sort((a, b) => titleMatchCount(b.title, terms) - titleMatchCount(a.title, terms))
		.slice(0, SEARCH_RESULT_LIMIT)
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
	const checks = collectGuidelineCheckSources(document).map(({ rule }) => toDocumentCheck(rule))
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
		checks,
		content: limitContent(formatGuidelineDocument(result, checks)),
		...(result.children.length
			? {
					relatedDocuments: result.children.map((child) => ({
						id: String(child.id),
						title: child.title,
					})),
				}
			: {}),
	}
}

function formatGuidelineDocument(
	result: AgentGuidelineDocument,
	checks: GuidelineDocumentCheck[],
): string {
	const document = result.document
	const breadcrumbs = document.breadcrumbs ?? []
	const parentTitle = breadcrumbs.length > 1 ? breadcrumbs.at(-2)?.label : null
	const kind =
		breadcrumbs.length === 1 ? 'Chapter' : breadcrumbs.length === 2 ? 'Section' : 'Page'
	const childSummaries = result.children.map((child) =>
		compact([child.title, child.descriptionText]).join('\n'),
	)
	const formattedChecks = checks.map(formatCheck)

	return compact([
		parentTitle ? `Parent: ${parentTitle}` : null,
		`${kind}: ${document.title}`,
		document.descriptionText,
		...(document.blocks?.map(formatBlockForAgent).filter(Boolean) ?? []),
		...childSummaries,
		formattedChecks.length ? `Checks:\n${formattedChecks.join('\n')}` : null,
	]).join('\n\n')
}

function searchTerms(query: string): string[] {
	return [...new Set(query.split(/\s+/).filter(Boolean))].slice(0, SEARCH_TERM_LIMIT)
}

function dedupeSearchCandidates(
	candidates: AgentGuidelineSearchCandidate[],
): AgentGuidelineSearchCandidate[] {
	return [
		...new Map(
			candidates.map((candidate) => [`${candidate.collection}:${candidate.id}`, candidate]),
		).values(),
	]
}

function titleMatchCount(title: string, terms: string[]): number {
	const normalizedTitle = title.toLocaleLowerCase()
	return terms.filter((term) => normalizedTitle.includes(term.toLocaleLowerCase())).length
}

function documentHref(document: AgentGuidelineDocument['document']): string | null {
	const breadcrumbs = document.breadcrumbs ?? []
	if (breadcrumbs.length === 3) {
		const sectionURL = breadcrumbs[1]?.url
		return sectionURL ? `${sectionURL}#${document.slug}` : null
	}
	return breadcrumbs.at(-1)?.url ?? null
}

type GuidelineDocumentRelatedDocument = {
	id: string
	title: string
}

function formatCheck(value: GuidelineDocumentCheck): string {
	return `- ${value.key}: ${value.title}`
}

function toDocumentCheck(check: { key: string; title: string }): GuidelineDocumentCheck {
	return { key: check.key, title: check.title }
}

function toAgentCheck({
	rule,
	evidence,
}: ReturnType<typeof collectGuidelineCheckSources>[number]): AgentCheckCatalogItem {
	return {
		evidence: formatCheckEvidence(evidence),
		key: rule.key,
		tier: rule.tier ?? null,
		title: rule.title,
	}
}

function limitContent(value: string): string {
	return value.length > MAX_DOCUMENT_CONTENT_LENGTH
		? `${value.slice(0, MAX_DOCUMENT_CONTENT_LENGTH)}...`
		: value
}
