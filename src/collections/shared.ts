import type { CollectionConfig } from 'payload'

/** 공용 versions 프리셋 — draft + 발행 예약, 문서당 이력 50개 유지. */
export const draftVersions: CollectionConfig['versions'] = {
	drafts: {
		schedulePublish: true,
	},
	maxPerDoc: 50,
}

/** 가이드라인 versions 프리셋 — 편집 내용을 2초 간격으로 자동 저장한다. */
export const guidelineDraftVersions: CollectionConfig['versions'] = {
	drafts: {
		autosave: {
			interval: 2000,
			showSaveDraftButton: true,
		},
		schedulePublish: true,
	},
	maxPerDoc: 50,
}
