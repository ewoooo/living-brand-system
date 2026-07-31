import type { PayloadRequest } from 'payload'
import { publishImportedApplicationImages } from '@/features/application-image/services/manage-imported-application-images.service'
import { findPrintOutputBlocker } from '@/features/template-export/print-policy'
import {
	inspectBaseTemplateHtml,
	inspectDraftTemplateAssetRefs,
} from '@/services/inspect-template-html.service'
import {
	findTemplateDraftBlocker,
	findTemplatePublishBlocker,
} from './validate-template-publish.service'

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

	await publishImportedApplicationImages(
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
