import config from '@payload-config'
import { getPayload } from 'payload'
import type { CheckExecutor } from '@/features/asset-check/checkers/types'
import type {
	CheckEvidence,
	CheckReferenceAssetRole,
} from '@/features/guideline/checks/check-source'
import {
	collectGuidelineCheckSources,
	type GuidelineCheckSource,
} from '@/features/guideline/checks/collect-guideline-check-sources'
import { findPublishedUnifiedGuidelineCheckDocuments } from '@/features/guideline/repositories/published-guideline-checks.payload.repository'
import { DEFAULT_LOCALE as LOCALE } from '@/lib/locale'
import type { GuidelineDocument } from '@/payload-types'

interface CheckRulesetCriterion {
	id?: string
	question?: string
	kind: 'presence' | 'measure'
	expected?: 'present' | 'absent'
	operator?: 'gte' | 'lte' | 'between'
	expectedValue?: number
	max?: number
	unit?: string
}

interface CheckRulesetMessages {
	pass?: string
	ok?: string
	needsReview?: string
	fail?: string
}

interface CheckRulesetCheck {
	key: string
	title: string
	titleKo?: string
	tier?: 'recommended' | 'required'
	checker: {
		key: string
		executor: CheckExecutor
		checkerKey?: string
		model?: string
		prompt?: string
	} | null
	options?: unknown
	criteria: CheckRulesetCriterion[]
	heuristicPrompt?: string
	messages?: CheckRulesetMessages
}

export interface CheckRulesetSource {
	check: CheckRulesetCheck
	source: { documentId: number }
	evidence: CheckEvidence
	referenceAssets: {
		name: string
		url?: string
		mimeType?: string
		role: CheckReferenceAssetRole
	}[]
}

export interface CheckRulesetSourceDocument {
	id: number
	title: string
	slug: string
	displayOrder: number
	breadcrumbDocumentIds: number[]
	checks: CheckRulesetSource[]
}

/** 검수 기준인 published 통합 Guideline 문서와 내부 Check source를 조회한다. */
export async function getCheckSourceDocuments(): Promise<{
	documents: CheckRulesetSourceDocument[]
}> {
	const payload = await getPayload({ config })
	const { documents } = await findPublishedUnifiedGuidelineCheckDocuments(payload, {
		locale: LOCALE,
		overrideAccess: true,
	})

	return { documents: documents.map(toCheckRulesetSourceDocument) }
}

function toCheckRulesetSourceDocument(document: GuidelineDocument): CheckRulesetSourceDocument {
	return {
		id: document.id,
		title: document.title,
		slug: document.slug,
		displayOrder: document.displayOrder,
		breadcrumbDocumentIds: (document.breadcrumbs ?? []).map(
			({ doc }) => relationshipId(doc) ?? -1,
		),
		checks: collectGuidelineCheckSources(document).map(toCheckRulesetSource),
	}
}

function toCheckRulesetSource({
	check,
	evidence,
	referenceAssets,
	source,
}: GuidelineCheckSource): CheckRulesetSource {
	const checker =
		typeof check.checker === 'object' && check.checker !== null ? check.checker : null

	return {
		check: {
			key: check.key,
			title: check.title,
			titleKo: check.titleKo ?? undefined,
			tier: check.tier,
			checker: checker
				? {
						key: checker.key,
						executor: checker.executor,
						checkerKey: checker.checkerKey ?? undefined,
						model: checker.model ?? undefined,
						prompt: checker.prompt ?? undefined,
					}
				: null,
			options: check.options ?? undefined,
			criteria: (check.criteria ?? []).map((criterion) => ({
				id: criterion.id ?? undefined,
				question: criterion.question,
				kind: criterion.kind,
				expected: criterion.expected ?? undefined,
				operator: criterion.operator ?? undefined,
				expectedValue: criterion.expectedValue ?? undefined,
				max: criterion.max ?? undefined,
				unit: criterion.unit ?? undefined,
			})),
			heuristicPrompt: check.heuristicPrompt ?? undefined,
			messages: check.messages
				? {
						pass: check.messages.pass ?? undefined,
						ok: check.messages.ok ?? undefined,
						needsReview: check.messages.needsReview ?? undefined,
						fail: check.messages.fail ?? undefined,
					}
				: undefined,
		},
		source: { documentId: source.documentId },
		evidence,
		referenceAssets: referenceAssets.map(({ asset, role }) => ({
			name: asset.name,
			url: asset.url ?? undefined,
			mimeType: asset.mimeType ?? undefined,
			role,
		})),
	}
}

function relationshipId(value: unknown): number | null {
	if (typeof value === 'number') return value
	if (!value || typeof value !== 'object' || !('id' in value)) return null
	return typeof value.id === 'number' ? value.id : null
}
