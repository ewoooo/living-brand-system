import { findTemplateRenderBlocker } from '@/features/template-import/services/validate-template-publish.service'
import type { TemplateOverrides } from '@/features/template-import/utils/compose-template-html'
import { type JsonTemplate, jsonTemplateSchema } from '@/types/json-template'
import { findPublishedTemplate } from '../repositories/published-template.payload.repository'

/** 기능 코드 층 — 디자인(jsonTemplate)과 분리된 별도 필드. js가 있으면 샌드박스로 실행된다. */
export interface TemplateCode {
	css: string
	js: string
}

interface PublishedTemplateBase {
	id: number
	name: string
}

export interface PublishedHtmlTemplate extends PublishedTemplateBase {
	kind: 'html'
	html: string
	// 입력 슬롯 스펙(input)이 든 노드 오버라이드 — 열린 슬롯 수집과 값 합성에 쓴다.
	overrides: TemplateOverrides
	width: number
	height: number
}

export interface PublishedJsonTemplate extends PublishedTemplateBase {
	kind: 'json'
	jsonTemplate: JsonTemplate
	code?: TemplateCode
}

export type PublishedTemplate = PublishedHtmlTemplate | PublishedJsonTemplate

/**
 * "Figma HTML 우선" 읽기 계약의 단일 판정 지점 — Create 화면과 챗 agent가 공유한다.
 * 사용 가능한 html·크기가 모두 있어야 html 템플릿으로 취급하고, 아니면 null(json 폴백)을 준다.
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
 * 읽기 계약: Figma HTML을 우선하고, 사용할 수 없으면 스키마가 유효한 JSON으로 폴백한다.
 */
export async function getPublishedTemplate(templateId: number): Promise<PublishedTemplate | null> {
	try {
		const template = await findPublishedTemplate(templateId)

		if (!template) {
			return null
		}

		const html = pickHtmlTemplate(template)

		if (html) {
			return {
				kind: 'html',
				id: template.id,
				name: template.name,
				...html,
			}
		}

		const parsed = jsonTemplateSchema.safeParse(template.jsonTemplate)

		if (!parsed.success) {
			return null
		}

		// 기능 코드는 별도 필드. js가 있을 때만 실행 대상으로 넘긴다(비었으면 정적 디자인).
		const code =
			template.code?.js != null && template.code.js !== ''
				? { css: template.code.css ?? '', js: template.code.js }
				: undefined

		return {
			kind: 'json',
			id: template.id,
			name: template.name,
			jsonTemplate: parsed.data,
			code,
		}
	} catch {
		return null
	}
}
