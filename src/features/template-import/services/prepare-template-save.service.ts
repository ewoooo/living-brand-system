import type { PayloadRequest } from 'payload'
import { publishDraftImportedApplicationImages } from '@/features/application-image/repositories/imported-application-image.payload.repository'
import { findPrintOutputBlocker } from '@/features/template-export/print-policy'
import {
	AUTHORIZED_ASSET_COLLECTIONS,
	type AuthorizedImageRef,
	inspectBaseTemplateHtml,
	inspectDraftTemplateAssetRefs,
	inspectDraftTemplateHtml,
	inspectTemplateHtml,
	isSafeDraftTemplateAssetUrl,
	parseTemplateNodeConfigs,
} from '@/services/inspect-template-html.service'
import { findAuthorizedAssetsByIds } from '../repositories/authorized-asset.payload.repository'

interface TemplateSaveCandidate {
	_status?: unknown
	baseHtml?: unknown
	height?: unknown
	html?: unknown
	overrides?: unknown
	printPpi?: unknown
	width?: unknown
}

/**
 * Template 저장 전 구조·인쇄 정책·발행 에셋을 한 순서로 준비하는 import Use Case.
 * Payload 조회·에셋 승격 I/O는 각 repository가 소유하고 같은 req 트랜잭션을 사용한다.
 */
export async function prepareTemplateSave({
	data,
	originalDoc,
	req,
}: {
	data: TemplateSaveCandidate
	originalDoc?: TemplateSaveCandidate | null
	req: PayloadRequest
}): Promise<string | null> {
	const candidate = { ...originalDoc, ...data }
	const draftBlocker = findTemplateDraftBlocker(candidate)
	if (draftBlocker) return draftBlocker

	const printBlocker = findPrintOutputBlocker(candidate)
	if (printBlocker) return printBlocker

	const finalStatus = data._status ?? originalDoc?._status
	if (finalStatus !== 'published') return null

	const importedRefs =
		typeof candidate.baseHtml === 'string'
			? inspectBaseTemplateHtml(candidate.baseHtml).refs
			: []
	const renderedRefs =
		typeof candidate.html === 'string' ? inspectDraftTemplateAssetRefs(candidate.html).refs : []

	await publishDraftImportedApplicationImages(
		req,
		importedRefs
			.filter(
				(imported) =>
					imported.collection === 'application-images' &&
					renderedRefs.some(
						(rendered) =>
							rendered.collection === imported.collection &&
							rendered.assetId === imported.assetId &&
							rendered.src === imported.src,
					),
			)
			.map((ref) => ref.assetId),
	)

	return findTemplatePublishBlocker(candidate, req)
}

function nonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== ''
}

function htmlTemplateRefs(
	candidate: TemplateSaveCandidate,
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
	const parsedNodeConfigs = parseTemplateNodeConfigs(candidate.overrides)
	if ('blocker' in parsedNodeConfigs) return parsedNodeConfigs

	for (const config of Object.values(parsedNodeConfigs.data)) {
		if (nonEmptyString(config.backgroundImage) && !config.generatedImageId) {
			return {
				blocker: '구조화 참조가 없는 배경 이미지는 draft에서만 사용할 수 있습니다.',
			}
		}
	}

	return inspectTemplateHtml({
		baseHtml: candidate.baseHtml,
		html: candidate.html,
		overrideNodeIds: Object.keys(parsedNodeConfigs.data),
		refsByNode: parsedNodeConfigs.refsByNode,
	})
}

/**
 * Templates draft 저장 게이트. 실행 가능한 HTML과 외부 URL을 차단하되
 * import staging 에셋과 magic-byte가 확인된 raster data URI는 draft에서만 허용한다.
 * 외부 I/O는 없다.
 */
function findTemplateDraftBlocker(candidate: TemplateSaveCandidate): string | null {
	const baseHtml = nonEmptyString(candidate.baseHtml) ? candidate.baseHtml : undefined
	const html = nonEmptyString(candidate.html) ? candidate.html : undefined
	if (!baseHtml && !html) return null

	const parsedNodeConfigs = parseTemplateNodeConfigs(candidate.overrides)
	if ('blocker' in parsedNodeConfigs) return parsedNodeConfigs.blocker

	for (const config of Object.values(parsedNodeConfigs.data)) {
		if (
			nonEmptyString(config.backgroundImage) &&
			!isSafeDraftTemplateAssetUrl(config.backgroundImage)
		) {
			return 'Draft 배경 이미지는 내부 에셋 또는 안전한 raster data URI여야 합니다.'
		}
	}

	return (
		inspectDraftTemplateHtml({
			baseHtml,
			html,
			overrideNodeIds: Object.keys(parsedNodeConfigs.data),
			refsByNode: parsedNodeConfigs.refsByNode,
		}).blocker ?? null
	)
}

/**
 * Templates 발행 게이트. 발행 가능한 모델과 에셋 규칙을 판정하고,
 * Payload 문서 조회만 authorized-asset repository에 맡긴다.
 */
async function findTemplatePublishBlocker(
	candidate: TemplateSaveCandidate,
	repositoryContext: Parameters<typeof findAuthorizedAssetsByIds>[0],
): Promise<string | null> {
	const htmlValidation = htmlTemplateRefs(candidate)
	if (!htmlValidation) return '발행할 HTML 템플릿이 필요합니다.'
	if ('blocker' in htmlValidation) return htmlValidation.blocker
	const invalidRefLabels = await findInvalidAuthorizedRefs(htmlValidation.refs, repositoryContext)
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
