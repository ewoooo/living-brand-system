import type { CollectionConfig } from 'payload'

/** 공용 versions 프리셋 — draft + 발행 예약, 문서당 이력 50개 유지. */
export const draftVersions: CollectionConfig['versions'] = {
	drafts: {
		schedulePublish: true,
	},
	maxPerDoc: 50,
}
