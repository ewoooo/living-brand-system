import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * 산출물 제작용 published Template·카테고리 조회 repository.
 * Worker 화면은 발행된 템플릿만 보므로 draft는 조회하지 않는다.
 */

const LOCALE = 'ko' as const
const FALLBACK_LOCALE = 'en' as const

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
			name: true,
			jsonTemplate: true,
		},
	})

	return templates.docs[0] ?? null
}
