import config from '@payload-config'
import { getPayload } from 'payload'
import type { Template } from '@/payload-types'

export type AgentTemplateDocument = Pick<Template, 'description' | 'id' | 'jsonTemplate' | 'name'>

export async function listAgentTemplates(user: unknown): Promise<AgentTemplateDocument[]> {
	const payload = await getPayload({ config })
	const templates = await payload.find({
		collection: 'templates',
		depth: 0,
		draft: false,
		fallbackLocale: 'en',
		limit: 50,
		locale: 'ko',
		overrideAccess: false,
		sort: '-updatedAt',
		user: user as never,
		where: {
			_status: {
				equals: 'published',
			},
		},
		select: {
			name: true,
			description: true,
			jsonTemplate: true,
		},
	})

	return templates.docs
}

export async function findAgentTemplate(
	user: unknown,
	templateId: number,
): Promise<AgentTemplateDocument | null> {
	const payload = await getPayload({ config })
	const templates = await payload.find({
		collection: 'templates',
		depth: 0,
		draft: false,
		fallbackLocale: 'en',
		limit: 1,
		locale: 'ko',
		overrideAccess: false,
		user: user as never,
		where: {
			id: {
				equals: templateId,
			},
			_status: {
				equals: 'published',
			},
		},
		select: {
			name: true,
			description: true,
			jsonTemplate: true,
		},
	})

	return templates.docs[0] ?? null
}
