import { type JsonTemplate, jsonTemplateSchema } from '@/types/json-template'
import { listPublishedTemplates } from '../repositories/published-template.payload.repository'

export interface PublishedTemplate {
	id: number
	name: string
	jsonTemplate: JsonTemplate
}

/**
 * Create 화면이 쓰는 published 템플릿 목록 read service.
 * 읽기 계약: Admin에서 json을 손으로 고칠 수 있으므로 스키마에 어긋난 템플릿은 목록에서 제외한다.
 */
export async function getPublishedTemplates(): Promise<PublishedTemplate[]> {
	try {
		const templates = await listPublishedTemplates()

		return templates.flatMap((template) => {
			const parsed = jsonTemplateSchema.safeParse(template.jsonTemplate)

			return parsed.success
				? [{ id: template.id, name: template.name, jsonTemplate: parsed.data }]
				: []
		})
	} catch {
		return []
	}
}
