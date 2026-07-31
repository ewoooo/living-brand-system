import config from '@payload-config'
import { getPayload } from 'payload'
import { DEFAULT_LOCALE, FALLBACK_LOCALE } from '@/lib/locale'
import type { Template } from '@/payload-types'

export type AgentTemplateDocument = Pick<
	Template,
	| 'description'
	| 'height'
	| 'html'
	| 'id'
	| 'name'
	| 'overrides'
	| 'printPpi'
	| 'updatedAt'
	| 'width'
>

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
		// ponytail: 목록 질의가 html 원문(현재 수 KB)을 함께 나른다. 템플릿이 수백 개로 늘면
		// 저장 시점에 슬롯 요약을 별도 필드로 스냅샷해 목록에서 html을 빼는 게 업그레이드 경로.
		select: {
			name: true,
			description: true,
			html: true,
			overrides: true,
			width: true,
			height: true,
			printPpi: true,
			updatedAt: true,
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
