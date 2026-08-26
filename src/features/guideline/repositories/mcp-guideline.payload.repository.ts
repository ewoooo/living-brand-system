import type { PayloadRequest } from 'payload'
import type { Guideline, GuidelineDocument, Rule } from '@/payload-types'
import { collectGuidelineCheckSources } from '../checks/collect-guideline-check-sources'
import { formatCheckEvidence } from '../checks/format-check-evidence'
import { findPublishedUnifiedGuidelineCheckDocuments } from './published-guideline-checks.payload.repository'

export type McpGuidelineDocument = Pick<
	GuidelineDocument,
	'id' | 'title' | 'slug' | 'headerImage' | 'rules' | 'blocks' | 'displayOrder' | 'chapter'
>

export interface McpGuidelineCheck {
	evidence: string
	key: string
	source: { documentId: number }
	tier: Rule['tier']
	title: string
}

/** published MCP 문서 조회와 Payload 레코드→MCP DTO 변환을 소유한다. */
export async function listPublishedMcpGuidelineDocuments(
	req: PayloadRequest,
	locale: 'en' | 'ko',
): Promise<McpGuidelineDocument[]> {
	const { docs } = await req.payload.find({
		collection: 'guideline-documents',
		depth: 1,
		draft: false,
		fallbackLocale: 'en',
		limit: 2000,
		locale,
		overrideAccess: false,
		pagination: false,
		req,
		sort: 'displayOrder',
		user: req.user,
		select: {
			title: true,
			slug: true,
			headerImage: true,
			rules: true,
			blocks: true,
			displayOrder: true,
			chapter: true,
		},
	})

	return docs.map((document) => ({
		id: document.id,
		title: document.title,
		slug: document.slug,
		headerImage: document.headerImage,
		rules: document.rules,
		blocks: document.blocks,
		displayOrder: document.displayOrder,
		chapter: document.chapter,
	}))
}

/** published Guideline Check를 MCP check DTO로 변환한다. */
export async function listPublishedMcpGuidelineChecks(
	req: PayloadRequest,
	locale: 'en' | 'ko',
): Promise<McpGuidelineCheck[]> {
	const { documents } = await findPublishedUnifiedGuidelineCheckDocuments(req.payload, {
		locale,
		overrideAccess: false,
		user: req.user,
	})

	return documents.flatMap((document) =>
		collectGuidelineCheckSources(document).map(({ rule, evidence, source }) => ({
			key: rule.key,
			title: rule.title,
			tier: rule.tier,
			evidence: formatCheckEvidence(evidence),
			source,
		})),
	)
}

/** live Guideline global을 MCP 응답 DTO로 변환한다. */
export async function findPublishedMcpGuideline(
	req: PayloadRequest,
	locale: 'en' | 'ko',
): Promise<Guideline> {
	const guideline = await req.payload.findGlobal({
		slug: 'guideline',
		depth: 1,
		draft: false,
		fallbackLocale: 'en',
		locale,
		overrideAccess: false,
		req,
		user: req.user,
	})

	return {
		id: guideline.id,
		companyName: guideline.companyName,
		documentTitle: guideline.documentTitle,
		issuedLabel: guideline.issuedLabel,
		favicon: guideline.favicon,
		primaryColor: guideline.primaryColor,
		primaryColorDark: guideline.primaryColorDark,
		_status: guideline._status,
		updatedAt: guideline.updatedAt,
		createdAt: guideline.createdAt,
	}
}
