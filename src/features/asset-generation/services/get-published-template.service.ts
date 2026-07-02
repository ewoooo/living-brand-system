import { type JsonTemplate, jsonTemplateSchema } from '@/types/json-template'
import { findPublishedTemplate } from '../repositories/published-template.payload.repository'

export interface PublishedTemplate {
	id: number
	name: string
	jsonTemplate: JsonTemplate
}

/**
 * Create 화면이 쓰는 published 템플릿 단건 read service.
 * 읽기 계약: Admin에서 json을 손으로 고칠 수 있으므로 스키마에 어긋나면 없는 것으로 처리한다.
 */
export async function getPublishedTemplate(templateId: number): Promise<PublishedTemplate | null> {
	try {
		const template = await findPublishedTemplate(templateId)

		if (!template) {
			return null
		}

		const parsed = jsonTemplateSchema.safeParse(template.jsonTemplate)

		return parsed.success
			? { id: template.id, name: template.name, jsonTemplate: parsed.data }
			: null
	} catch {
		return null
	}
}
