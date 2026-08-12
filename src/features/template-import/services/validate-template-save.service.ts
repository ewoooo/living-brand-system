import {
	findMissingOverrideNodeBlocker,
	inspectTemplateFragment,
	type TemplateFragmentInspection,
} from '@/features/template-core/domain/inspect-template-html'
import type { ParsedTemplateNodeConfigs } from '@/features/template-core/domain/parse-template-node-configs'
import {
	AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS,
	type AuthorizedTemplateImageRef,
	isSafeDraftTemplateAssetUrl,
} from '@/features/template-core/domain/template-asset-policy'
import { findAuthorizedAssetsByIds } from '../repositories/authorized-asset.payload.repository'

interface TemplateSaveCandidate {
	html?: unknown
	width?: unknown
	height?: unknown
}

export function nonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== ''
}

/**
 * Draft 저장을 검사한다 — overrides의 배경 이미지 출처와 fragment blocker,
 * override가 참조하는 노드의 존재를 본다. 파싱·외부 I/O 없음 —
 * parsed와 base/draft fragment는 호출 Use Case(prepareTemplateSave)가 한 번 만들어 전달한다.
 */
export function findTemplateDraftBlocker(
	parsed: ParsedTemplateNodeConfigs,
	base: TemplateFragmentInspection | undefined,
	draft: TemplateFragmentInspection | undefined,
): string | null {
	for (const config of Object.values(parsed.data)) {
		if (
			nonEmptyString(config.backgroundImage) &&
			!isSafeDraftTemplateAssetUrl(config.backgroundImage)
		) {
			return 'Draft 배경 이미지는 내부 에셋 또는 안전한 raster data URI여야 합니다.'
		}
	}

	if (base?.blocker) return base.blocker
	if (draft?.blocker) return draft.blocker

	const nodeIds = draft?.nodeIds ?? base?.nodeIds
	return nodeIds ? findMissingOverrideNodeBlocker(Object.keys(parsed.data), [nodeIds]) : null
}

/**
 * 발행 가능한 HTML 모델과 published 에셋 참조를 검증한다 — 공개(html) fragment만 여기서 파싱하고,
 * parsed와 base fragment(draft 검사를 통과한 것)는 호출 Use Case가 한 번 만들어 전달한다.
 * 인가 에셋 조회 I/O는 authorized-asset repository가 소유한다.
 */
export async function findTemplatePublishBlocker(
	candidate: TemplateSaveCandidate,
	parsed: ParsedTemplateNodeConfigs | undefined,
	base: TemplateFragmentInspection | undefined,
	repositoryContext: Parameters<typeof findAuthorizedAssetsByIds>[0],
): Promise<string | null> {
	if (!parsed) return '발행할 HTML 템플릿이 필요합니다.'
	if (!base || !nonEmptyString(candidate.html)) {
		return 'HTML 템플릿의 baseHtml과 html이 모두 필요합니다.'
	}
	if (base.blocker) return base.blocker
	if (
		typeof candidate.width !== 'number' ||
		!Number.isFinite(candidate.width) ||
		candidate.width <= 0 ||
		typeof candidate.height !== 'number' ||
		!Number.isFinite(candidate.height) ||
		candidate.height <= 0
	) {
		return 'HTML 템플릿의 width와 height는 0보다 큰 숫자여야 합니다.'
	}

	for (const config of Object.values(parsed.data)) {
		if (nonEmptyString(config.backgroundImage) && !config.generatedImageId) {
			return '구조화 참조가 없는 배경 이미지는 draft에서만 사용할 수 있습니다.'
		}
	}

	const published = inspectTemplateFragment(candidate.html, 'public', parsed.refsByNode)
	if (published.blocker) return published.blocker

	const overrideBlocker = findMissingOverrideNodeBlocker(Object.keys(parsed.data), [
		base.nodeIds,
		published.nodeIds,
	])
	if (overrideBlocker) return overrideBlocker

	const invalidRefLabels = await findInvalidAuthorizedRefs(published.refs, repositoryContext)
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
