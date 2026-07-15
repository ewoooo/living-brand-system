import config from '@payload-config'
import { getPayload } from 'payload'
import { DEFAULT_LOCALE, FALLBACK_LOCALE } from '@/lib/locale'
import type { Template } from '@/payload-types'

type AgentTemplateCheckPlacement = {
	body?: null | string
	checkKey?: null | string
}

export type AgentTemplateDocument = Pick<
	Template,
	'description' | 'height' | 'html' | 'id' | 'jsonTemplate' | 'name' | 'overrides' | 'width'
> & {
	templateChecks?: AgentTemplateCheckPlacement[] | null
}

/** 두 조회가 공유하는 published 템플릿 질의 기본값 — user 컨텍스트로 access를 강제한다. */
function publishedTemplateQuery(user: unknown) {
	return {
		collection: 'templates' as const,
		depth: 1,
		draft: false,
		fallbackLocale: FALLBACK_LOCALE,
		locale: DEFAULT_LOCALE,
		overrideAccess: false,
		user: user as never,
		select: {
			name: true,
			description: true,
			jsonTemplate: true,
			html: true,
			overrides: true,
			width: true,
			height: true,
			templateChecks: true,
		},
	} as const
}

export async function listAgentTemplates(user: unknown): Promise<AgentTemplateDocument[]> {
	const payload = await getPayload({ config })
	const templates = await payload.find({
		...publishedTemplateQuery(user),
		limit: 50,
		sort: '-updatedAt',
		where: {
			_status: {
				equals: 'published',
			},
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
		...publishedTemplateQuery(user),
		limit: 1,
		where: {
			id: {
				equals: templateId,
			},
			_status: {
				equals: 'published',
			},
		},
	})

	return templates.docs[0] ?? null
}
