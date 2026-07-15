import config from '@payload-config'
import { getPayload } from 'payload'
import { collectGuidelineCheckSources } from '@/features/guideline/checks/collect-guideline-check-sources'
import { formatCheckEvidence } from '@/features/guideline/checks/format-check-evidence'
import { findPublishedUnifiedGuidelineCheckDocuments } from '@/features/guideline/repositories/published-guideline-checks.payload.repository'
import type { GuidelineDocument } from '@/payload-types'

type AgentGuidelineDocumentData = Pick<
	GuidelineDocument,
	| 'id'
	| 'title'
	| 'slug'
	| 'description'
	| 'headerImage'
	| 'blocks'
	| 'checks'
	| 'parent'
	| 'breadcrumbs'
>

export type AgentGuidelineListItem = Pick<
	GuidelineDocument,
	'id' | 'title' | 'parent' | 'breadcrumbs'
>

type AgentGuidelineChild = Pick<GuidelineDocument, 'id' | 'title' | 'slug' | 'description'>

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

export type AgentGuidelineDocument = {
	collection: 'guideline-documents'
	document: AgentGuidelineDocumentData
	children: AgentGuidelineChild[]
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

export async function listGuidelineDocuments(user: unknown): Promise<AgentGuidelineListItem[]> {
	const payload = await getPayload({ config })
	const documents = await payload.find({
		...publishedKoQuery(user),
		collection: 'guideline-documents',
		depth: 0,
		limit: 2000,
		sort: 'displayOrder',
		select: {
			title: true,
			parent: true,
			breadcrumbs: true,
		},
	})

	return documents.docs
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
		.filter((result) => result.doc?.relationTo === 'guideline-documents')
		.map((result) => ({
			title: result.title || '',
			collection: 'guideline-documents' as const,
			id: String(result.doc?.value || ''),
		}))
		.filter((result) => result.title && result.id)
}

export async function findAgentChecks(user: unknown): Promise<AgentCheckCatalogItem[]> {
	const payload = await getPayload({ config })
	const { documents } = await findPublishedUnifiedGuidelineCheckDocuments(payload, {
		overrideAccess: false,
		user,
	})

	return documents
		.flatMap(collectGuidelineCheckSources)
		.map(({ check, evidence }) => ({
			evidence: formatCheckEvidence(evidence),
			key: check.key,
			tier: check.tier ?? null,
			title: check.title,
		}))
		.sort((a, b) => a.key.localeCompare(b.key))
}

export async function findAgentGuidelineDocument(
	user: unknown,
	input: { collection: 'guideline-documents'; id: string },
): Promise<AgentGuidelineDocument | null> {
	const payload = await getPayload({ config })
	const document = await payload.findByID({
		...publishedKoQuery(user),
		collection: 'guideline-documents',
		id: input.id,
		disableErrors: true,
		depth: 2,
		select: {
			title: true,
			slug: true,
			description: true,
			headerImage: true,
			blocks: true,
			checks: true,
			parent: true,
			breadcrumbs: true,
			_status: true,
		},
	})
	if (document?._status !== 'published') return null

	const children = await payload.find({
		...publishedKoQuery(user),
		collection: 'guideline-documents',
		depth: 0,
		limit: 100,
		sort: 'displayOrder',
		where: { parent: { equals: document.id } },
		select: {
			title: true,
			slug: true,
			description: true,
		},
	})

	return {
		collection: 'guideline-documents',
		document,
		children: children.docs,
		checks: collectGuidelineCheckSources(document).map(toAgentCheck),
	}
}

function toAgentCheck({
	check,
	evidence,
}: ReturnType<typeof collectGuidelineCheckSources>[number]): AgentCheckCatalogItem {
	return {
		evidence: formatCheckEvidence(evidence),
		key: check.key,
		tier: check.tier ?? null,
		title: check.title,
	}
}
