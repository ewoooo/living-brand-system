import { findTemplateRenderBlocker } from '@/features/template-import/services/validate-template-publish.service'
import type { TemplateOverrides } from '@/features/template-import/utils/compose-template-html'
import { type PrintPpi, parsePrintPpi } from '../print-output'
import { findPublishedTemplate } from '../repositories/published-template.payload.repository'

export interface PublishedHtmlTemplate {
	kind: 'html'
	id: number
	name: string
	html: string
	// 입력 슬롯 스펙(input)이 든 노드 오버라이드 — 열린 슬롯 수집과 값 합성에 쓴다.
	overrides: TemplateOverrides
	width: number
	height: number
	printPpi?: PrintPpi
	templateVersion: string
}

/**
 * canonical HTML 읽기 계약의 단일 판정 지점 — Create 화면과 챗 agent가 공유한다.
 * 사용 가능한 html·크기가 모두 있어야 HTML 템플릿으로 취급한다.
 * 외부 I/O는 없으며 템플릿 조회는 published-template repository가 소유한다.
 */
export function pickHtmlTemplate(template: {
	html?: string | null
	overrides?: unknown
	width?: number | null
	height?: number | null
}): { html: string; overrides: TemplateOverrides; width: number; height: number } | null {
	if (
		typeof template.html === 'string' &&
		template.html.trim() !== '' &&
		typeof template.width === 'number' &&
		template.width > 0 &&
		typeof template.height === 'number' &&
		template.height > 0 &&
		findTemplateRenderBlocker(template) == null
	) {
		return {
			html: template.html,
			overrides: (template.overrides ?? {}) as TemplateOverrides,
			width: template.width,
			height: template.height,
		}
	}

	return null
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

	const html = pickHtmlTemplate(template)

	if (!html) return null

	return {
		kind: 'html',
		id: template.id,
		name: template.name,
		printPpi: parsePrintPpi(template.printPpi),
		templateVersion: template.updatedAt,
		...html,
	}
}
