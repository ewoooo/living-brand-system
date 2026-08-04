import { type PrintPpi, parsePrintPpi } from '@/features/template-export/print-policy'
import { findPublishedTemplate } from '@/repositories/published-template.payload.repository'
import { projectTemplateRenderModel } from '@/services/project-template-render-model.service'
import type { TemplateNodeConfigMap } from '@/types/template'

export interface PublishedHtmlTemplate {
	kind: 'html'
	id: number
	name: string
	html: string
	// 입력 슬롯 스펙(input)이 든 노드 오버라이드 — 열린 슬롯 수집과 값 합성에 쓴다.
	nodeConfigs: TemplateNodeConfigMap
	width: number
	height: number
	printPpi?: PrintPpi
	templateVersion: string
}

/**
 * Create 화면이 쓰는 published 템플릿 단건 read service.
 * Payload 조회는 published-template repository가 소유한다.
 * 읽기 계약: 렌더 가능한 canonical HTML이 아니면 노출하지 않는다.
 */
export async function getPublishedTemplate(
	templateId: number,
): Promise<PublishedHtmlTemplate | null> {
	const template = await findPublishedTemplate(templateId)

	if (!template) {
		return null
	}

	const renderModel = projectTemplateRenderModel(template)

	if (!renderModel) return null

	return {
		kind: 'html',
		id: template.id,
		name: template.name,
		printPpi: parsePrintPpi(template.printPpi),
		templateVersion: template.updatedAt,
		...renderModel,
	}
}
