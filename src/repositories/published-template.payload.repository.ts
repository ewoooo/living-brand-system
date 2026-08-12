import config from '@payload-config'
import { getPayload } from 'payload'
import { FALLBACK_LOCALE, DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

/**
 * published Template·카테고리 조회를 공유하는 repository.
 * Worker 화면은 발행된 템플릿만 보므로 draft는 조회하지 않는다.
 * guideline 공개 SSR과 같은 패턴으로 인증 없이 조회한다(overrideAccess 기본값) —
 * published 산출물 표면은 의도적으로 공개이며, draft·비발행본은 여기서 노출되지 않는다.
 */

export async function listTemplateCategories() {
	const payload = await getPayload({ config })
	const categories = await payload.find({
		collection: 'template-categories',
		depth: 0,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 100,
		locale: LOCALE,
		sort: 'displayOrder',
		select: {
			title: true,
			slug: true,
		},
	})

	return categories.docs
}

export async function listPublishedTemplateNavItems() {
	const payload = await getPayload({ config })
	const templates = await payload.find({
		collection: 'templates',
		depth: 0,
		draft: false,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 200,
		locale: LOCALE,
		sort: '-updatedAt',
		where: {
			_status: {
				equals: 'published',
			},
		},
		select: {
			name: true,
			category: true,
			html: true,
			overrides: true,
			width: true,
			height: true,
		},
	})

	return templates.docs
}

export async function findPublishedTemplate(templateId: number) {
	const payload = await getPayload({ config })
	const templates = await payload.find({
		collection: 'templates',
		depth: 0,
		draft: false,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 1,
		locale: LOCALE,
		where: {
			id: {
				equals: templateId,
			},
			_status: {
				equals: 'published',
			},
		},
		select: {
			controller: true,
			name: true,
			updatedAt: true,
			html: true,
			overrides: true,
			width: true,
			height: true,
			printPpi: true,
		},
	})

	return templates.docs[0] ?? null
}
