import { z } from 'zod'
import { AUTHORIZED_ASSET_COLLECTIONS } from '@/types/json-template'
import { findAuthorizedAssetsByIds } from '../repositories/authorized-asset.payload.repository'
import {
	type AuthorizedImageRef,
	validateTemplateImages,
} from '../utils/validate-authorized-assets'
import {
	inspectDraftTemplateHtml,
	inspectPublishedTemplateHtml,
	inspectTemplateHtml,
	isSafeDraftTemplateAssetUrl,
} from '../utils/validate-template-html'

const templateInputSchema = z
	.object({
		label: z.string().optional(),
		placeholder: z.string().optional(),
		maxLength: z.number().int().positive().optional(),
		maxLines: z.number().int().positive().optional(),
		inputFormat: z.enum(['free', 'number', 'email', 'date']).optional(),
		aiInstruction: z.string().optional(),
	})
	.strict()

const templateOverridesSchema = z.record(
	z.string().min(1),
	z
		.object({
			text: z.string().optional(),
			backgroundImage: z.string().optional(),
			input: templateInputSchema.optional(),
			vectorAsset: z
				.object({
					collection: z.enum(AUTHORIZED_ASSET_COLLECTIONS),
					id: z.number().int().positive(),
					src: z.string().min(1),
				})
				.strict()
				.optional(),
			vectorFit: z.enum(['fill', 'contain']).optional(),
			vectorColor: z.string().optional(),
		})
		.strict(),
)

interface TemplatePublishCandidate {
	jsonTemplate?: unknown
	baseHtml?: unknown
	overrides?: unknown
	html?: unknown
	width?: unknown
	height?: unknown
}

type ParsedOverrides = z.infer<typeof templateOverridesSchema>

function nonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== ''
}

function parseOverrides(candidate: TemplatePublishCandidate):
	| { blocker: string }
	| {
			data: ParsedOverrides
			refsByNode: Map<string, AuthorizedImageRef>
	  } {
	const parsed = templateOverridesSchema.safeParse(candidate.overrides ?? {})
	if (!parsed.success) {
		return { blocker: 'HTML 템플릿의 overrides 형식이 올바르지 않습니다.' }
	}

	const refsByNode = new Map<string, AuthorizedImageRef>()
	for (const [nodeId, override] of Object.entries(parsed.data)) {
		if (override.vectorAsset) {
			refsByNode.set(nodeId, {
				collection: override.vectorAsset.collection,
				assetId: override.vectorAsset.id,
				src: override.vectorAsset.src,
				label: nodeId,
			})
		}
	}

	return { data: parsed.data, refsByNode }
}

function htmlTemplateRefs(
	candidate: TemplatePublishCandidate,
): { blocker: string } | { refs: AuthorizedImageRef[] } | null {
	const active = nonEmptyString(candidate.baseHtml) || nonEmptyString(candidate.html)
	if (!active) return null

	if (!nonEmptyString(candidate.baseHtml) || !nonEmptyString(candidate.html)) {
		return { blocker: 'HTML 템플릿의 baseHtml과 html이 모두 필요합니다.' }
	}
	if (
		typeof candidate.width !== 'number' ||
		!Number.isFinite(candidate.width) ||
		candidate.width <= 0 ||
		typeof candidate.height !== 'number' ||
		!Number.isFinite(candidate.height) ||
		candidate.height <= 0
	) {
		return { blocker: 'HTML 템플릿의 width와 height는 0보다 큰 숫자여야 합니다.' }
	}
	const parsedOverrides = parseOverrides(candidate)
	if ('blocker' in parsedOverrides) return parsedOverrides

	for (const override of Object.values(parsedOverrides.data)) {
		if (nonEmptyString(override.backgroundImage)) {
			return {
				blocker:
					'배경 이미지는 아직 인가 에셋 참조를 저장하지 않으므로 draft에서만 사용할 수 있습니다.',
			}
		}
	}

	return inspectTemplateHtml({
		baseHtml: candidate.baseHtml,
		html: candidate.html,
		overrideNodeIds: Object.keys(parsedOverrides.data),
		refsByNode: parsedOverrides.refsByNode,
	})
}

/**
 * Templates draft 저장 게이트 Use Case. 실행 가능한 HTML과 외부 URL을 차단하되
 * import staging 에셋과 magic-byte가 확인된 raster data URI는 draft에서만 허용한다.
 */
export function findTemplateDraftBlocker(candidate: TemplatePublishCandidate): string | null {
	const baseHtml = nonEmptyString(candidate.baseHtml) ? candidate.baseHtml : undefined
	const html = nonEmptyString(candidate.html) ? candidate.html : undefined
	if (!baseHtml && !html) return null

	const parsedOverrides = parseOverrides(candidate)
	if ('blocker' in parsedOverrides) return parsedOverrides.blocker

	for (const override of Object.values(parsedOverrides.data)) {
		if (
			nonEmptyString(override.backgroundImage) &&
			!isSafeDraftTemplateAssetUrl(override.backgroundImage)
		) {
			return 'Draft 배경 이미지는 내부 에셋 또는 안전한 raster data URI여야 합니다.'
		}
	}

	return (
		inspectDraftTemplateHtml({
			baseHtml,
			html,
			overrideNodeIds: Object.keys(parsedOverrides.data),
			refsByNode: parsedOverrides.refsByNode,
		}).blocker ?? null
	)
}

/**
 * 기존 published HTML을 Create/Agent에 넘기기 직전 다시 확인하는 읽기 경계.
 * 신규 발행뿐 아니라 게이트 도입 전 레코드도 실행 가능한 마크업이면 fail-closed 한다.
 */
export function findTemplateRenderBlocker(candidate: TemplatePublishCandidate): string | null {
	if (
		!nonEmptyString(candidate.html) ||
		typeof candidate.width !== 'number' ||
		candidate.width <= 0 ||
		typeof candidate.height !== 'number' ||
		candidate.height <= 0
	) {
		return '렌더 가능한 HTML 모델이 아닙니다.'
	}

	const parsedOverrides = parseOverrides(candidate)
	if ('blocker' in parsedOverrides) return parsedOverrides.blocker
	if (
		Object.values(parsedOverrides.data).some((override) =>
			nonEmptyString(override.backgroundImage),
		)
	) {
		return '구조화되지 않은 배경 이미지는 published HTML에서 렌더할 수 없습니다.'
	}

	return (
		inspectPublishedTemplateHtml({
			html: candidate.html,
			overrideNodeIds: Object.keys(parsedOverrides.data),
			refsByNode: parsedOverrides.refsByNode,
		}).blocker ?? null
	)
}

/**
 * Templates 발행 게이트 Use Case. Service가 발행 가능한 모델과 에셋 규칙을 판정하고,
 * Payload 문서 조회만 authorized-asset repository에 맡긴다.
 */
export async function findTemplatePublishBlocker(
	candidate: TemplatePublishCandidate,
	repositoryContext: Parameters<typeof findAuthorizedAssetsByIds>[0],
): Promise<string | null> {
	const htmlValidation = htmlTemplateRefs(candidate)
	let refs: AuthorizedImageRef[]

	if (htmlValidation && 'blocker' in htmlValidation) return htmlValidation.blocker
	if (htmlValidation) {
		refs = htmlValidation.refs
	} else {
		const validation = validateTemplateImages(candidate.jsonTemplate)

		if (validation.status === 'empty') {
			return '발행할 HTML 또는 JSON 템플릿이 필요합니다.'
		}
		if (validation.status === 'invalid') {
			return 'jsonTemplate이 스키마(src/types/json-template.ts)와 맞지 않아 저장할 수 없습니다.'
		}
		if (validation.unauthorizedLabels.length > 0) {
			return `인가된 에셋으로 교체되지 않은 이미지가 있습니다: ${validation.unauthorizedLabels.join(', ')}. 미리보기에서 각 이미지를 브랜드 에셋으로 교체한 뒤 저장하세요.`
		}

		refs = validation.authorizedRefs
	}

	const invalidRefLabels = await findInvalidAuthorizedRefs(refs, repositoryContext)
	if (invalidRefLabels.length > 0) {
		return `인가 에셋 참조가 유효하지 않습니다: ${invalidRefLabels.join(', ')}. 미리보기에서 에셋을 다시 선택하세요.`
	}

	return null
}

async function findInvalidAuthorizedRefs(
	refs: AuthorizedImageRef[],
	repositoryContext: Parameters<typeof findAuthorizedAssetsByIds>[0],
): Promise<string[]> {
	const invalidLabels: string[] = []

	for (const collection of AUTHORIZED_ASSET_COLLECTIONS) {
		const collectionRefs = refs.filter((ref) => ref.collection === collection)
		if (collectionRefs.length === 0) continue

		const docsById = await findAuthorizedAssetsByIds(
			repositoryContext,
			collection,
			collectionRefs.map((ref) => ref.assetId),
		)

		for (const ref of collectionRefs) {
			const doc = docsById.get(ref.assetId)
			if (doc?.url !== ref.src) invalidLabels.push(ref.label)
		}
	}

	return invalidLabels
}
