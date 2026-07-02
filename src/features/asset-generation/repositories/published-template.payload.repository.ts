import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * 산출물 제작용 published Template 조회 repository.
 * Worker 화면은 발행된 템플릿만 보므로 draft는 조회하지 않는다.
 */
export async function listPublishedTemplates() {
	const payload = await getPayload({ config })
	const templates = await payload.find({
		collection: 'templates',
		depth: 0,
		draft: false,
		fallbackLocale: 'en',
		limit: 100,
		locale: 'ko',
		sort: '-updatedAt',
		where: {
			_status: {
				equals: 'published',
			},
		},
		select: {
			name: true,
			jsonTemplate: true,
		},
	})

	return templates.docs
}
