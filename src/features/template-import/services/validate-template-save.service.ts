import {
	inspectDraftTemplateHtml,
	inspectTemplateHtml,
} from '@/services/inspect-template-html.service'
import { parseTemplateNodeConfigs } from '@/services/parse-template-node-configs.service'
import {
	AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS,
	type AuthorizedTemplateImageRef,
	isSafeDraftTemplateAssetUrl,
} from '@/services/template-asset-policy.service'
import { findAuthorizedAssetsByIds } from '../repositories/authorized-asset.payload.repository'

interface TemplateSaveCandidate {
	baseHtml?: unknown
	overrides?: unknown
	html?: unknown
	width?: unknown
	height?: unknown
}

function nonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== ''
}

function htmlTemplateRefs(
	candidate: TemplateSaveCandidate,
): { blocker: string } | { refs: AuthorizedTemplateImageRef[] } | null {
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

/** Draft 저장 시 실행 가능한 HTML과 외부 URL을 차단하고 staging 에셋만 허용한다. */
export function findTemplateDraftBlocker(candidate: TemplateSaveCandidate): string | null {
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

/** 발행 가능한 HTML 모델과 published 에셋 참조를 검증한다. */
export async function findTemplatePublishBlocker(
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
	refs: AuthorizedTemplateImageRef[],
	repositoryContext: Parameters<typeof findAuthorizedAssetsByIds>[0],
): Promise<string[]> {
	const invalidLabels: string[] = []

	for (const collection of AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS) {
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
