import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'
import type { AuthorizedTemplateAssetCollection } from '@/features/template-core/domain/template-asset-policy'
import {
	countTemplatesByCategory,
	findTemplateAssetFilename,
	listPublishedTemplates,
	type PublishedTemplateScanRow,
} from '@/features/template-core/repositories/template-reference.payload.repository'
import type { TemplateNodeConfigMap } from '@/types/template'

/**
 * 발행 템플릿이 참조 중인 자원(에셋 파일·이미지 프로파일·카테고리)의 삭제와 발행 해제를
 * 막는 참조 무결성 가드 service. Payload 조회 I/O는 template-reference repository가 소유한다.
 */

function templateLabels(templates: PublishedTemplateScanRow[]): string {
	return templates
		.map((template) =>
			typeof template.name === 'string' && template.name ? template.name : `#${template.id}`,
		)
		.join(', ')
}

/**
 * 발행 행을 draft로 내리는 갱신(unpublish)인지 판정한다.
 * Save Draft(?draft=true)는 발행본을 유지하므로 통과시킨다.
 * ponytail: REST query 신호만 본다 — local API draft:true 저장 경로는 이 컬렉션들에 없고,
 * 생기면 오탐(차단)일 뿐 발행본이 깨지지는 않는다.
 */
export function isUnpublishTransition(args: {
	data: { _status?: unknown }
	originalDoc?: { _status?: unknown } | null
	req: PayloadRequest
}): boolean {
	if (args.data?._status !== 'draft' || args.originalDoc?._status !== 'published') return false
	return args.req.query?.draft !== 'true'
}

/** 파일 URL을 html에 담은 발행 템플릿이 있으면 APIError를 던진다. */
async function assertAssetFileUnreferenced(
	req: PayloadRequest,
	collection: AuthorizedTemplateAssetCollection,
	filename: unknown,
	action: '삭제' | '발행 해제',
): Promise<void> {
	if (typeof filename !== 'string' || !filename) return
	const url = `/api/${collection}/file/${filename}`
	const referencing = (await listPublishedTemplates(req)).filter(
		(template) => typeof template.html === 'string' && template.html.includes(url),
	)
	if (referencing.length === 0) return
	throw new APIError(
		`발행된 템플릿(${templateLabels(referencing)})이 이 파일을 사용 중이어서 ${action}할 수 없습니다. 템플릿에서 참조를 제거하거나 템플릿을 먼저 발행 해제하세요.`,
		400,
	)
}

/** 에셋 컬렉션에 붙일 삭제·발행 해제 가드 훅 한 쌍. */
export function templateAssetReferenceGuardHooks(
	collection: AuthorizedTemplateAssetCollection,
): CollectionConfig['hooks'] {
	return {
		beforeChange: [
			async ({ data, originalDoc, req }) => {
				if (isUnpublishTransition({ data, originalDoc, req })) {
					await assertAssetFileUnreferenced(
						req,
						collection,
						originalDoc?.filename ?? data.filename,
						'발행 해제',
					)
				}
				return data
			},
		],
		beforeDelete: [
			async ({ id, req }) => {
				const filename = await findTemplateAssetFilename(req, collection, id)
				await assertAssetFileUnreferenced(req, collection, filename, '삭제')
			},
		],
	}
}

function templatePinsProfile(overrides: unknown, profileId: number): boolean {
	if (!overrides || typeof overrides !== 'object') return false
	return Object.values(overrides as TemplateNodeConfigMap).some(
		(config) => config?.imageInput?.profileId === profileId,
	)
}

/** overrides가 이 프로파일을 이미지 슬롯에 고정한 발행 템플릿이 있으면 APIError를 던진다. */
export async function assertImageProfileUnpinned(
	req: PayloadRequest,
	profileId: number,
	action: '삭제' | '발행 해제',
): Promise<void> {
	if (!Number.isFinite(profileId)) return
	const referencing = (await listPublishedTemplates(req)).filter((template) =>
		templatePinsProfile(template.overrides, profileId),
	)
	if (referencing.length === 0) return
	throw new APIError(
		`발행된 템플릿(${templateLabels(referencing)})이 이 프로파일을 이미지 슬롯에 고정하고 있어 ${action}할 수 없습니다. 템플릿의 이미지 슬롯 설정을 먼저 변경하세요.`,
		400,
	)
}

/**
 * 카테고리를 참조하는 템플릿이 하나라도 있으면 삭제를 거부한다.
 * category는 Templates에서 required라 SET NULL로 남으면 해당 템플릿 전부가 저장 불가가 된다.
 * ponytail: 메인 행 기준 count — draft 버전에서만 재배정된 참조는 세지 않는다.
 */
export async function assertTemplateCategoryDeletable(
	req: PayloadRequest,
	categoryId: number,
): Promise<void> {
	const totalDocs = await countTemplatesByCategory(req, categoryId)
	if (totalDocs === 0) return
	throw new APIError(
		`템플릿 ${totalDocs}건이 이 분류를 사용 중이어서 삭제할 수 없습니다. 템플릿의 분류를 먼저 변경하세요.`,
		400,
	)
}
