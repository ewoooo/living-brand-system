import { type JsonTemplate, jsonTemplateSchema } from '@/types/json-template'
import { findPublishedTemplate } from '../repositories/published-template.payload.repository'

/** 기능 코드 층 — 디자인(jsonTemplate)과 분리된 별도 필드. js가 있으면 샌드박스로 실행된다. */
export interface TemplateCode {
	css: string
	js: string
}

export interface PublishedTemplate {
	id: number
	name: string
	jsonTemplate: JsonTemplate
	code?: TemplateCode
}

/**
 * Create 화면이 쓰는 published 템플릿 단건 read service.
 * Payload 조회는 published-template repository가 소유한다.
 * 읽기 계약: Admin에서 json을 손으로 고칠 수 있으므로 스키마에 어긋나면 없는 것으로 처리한다.
 */
export async function getPublishedTemplate(templateId: number): Promise<PublishedTemplate | null> {
	try {
		const template = await findPublishedTemplate(templateId)

		if (!template) {
			return null
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

		return { id: template.id, name: template.name, jsonTemplate: parsed.data, code }
	} catch {
		return null
	}
}
