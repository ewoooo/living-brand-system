import config from '@payload-config'
import { getPayload } from 'payload'
import type { JsonTemplate } from '@/types/json-template'

/**
 * 템플릿 임포트의 Payload 저장 경계.
 * user + overrideAccess: false로 호출해 컬렉션 access(manager/admin 쓰기)를 그대로 강제한다.
 */

export async function createTemplateAsset(
	user: unknown,
	input: { data: Buffer; filename: string; mimeType: string },
): Promise<{ id: number; url: string }> {
	const payload = await getPayload({ config })
	const asset = await payload.create({
		collection: 'template-assets',
		data: {},
		file: {
			data: input.data,
			name: input.filename,
			mimetype: input.mimeType,
			size: input.data.byteLength,
		},
		overrideAccess: false,
		user: user as never,
	})

	if (!asset.url) {
		throw new Error(`Template asset ${asset.id} has no URL.`)
	}

	return { id: asset.id, url: asset.url }
}

export async function createDraftTemplate(
	user: unknown,
	input: { name: string; sourceUrl: string; jsonTemplate: JsonTemplate },
): Promise<{ id: number }> {
	const payload = await getPayload({ config })
	const template = await payload.create({
		collection: 'templates',
		data: {
			name: input.name,
			sourceType: 'figma',
			sourceUrl: input.sourceUrl,
			jsonTemplate: input.jsonTemplate,
			_status: 'draft',
		},
		draft: true,
		overrideAccess: false,
		user: user as never,
	})

	return { id: template.id }
}
