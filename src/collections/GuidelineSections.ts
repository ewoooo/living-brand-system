import { type CollectionConfig, slugField } from 'payload'

export const GuidelineSections: CollectionConfig = {
	slug: 'sections',
	dbName: 'guideline_sections',
	labels: {
		singular: 'Section',
		plural: 'Sections',
	},
	admin: {
		group: 'Guideline',
		useAsTitle: 'title',
		defaultColumns: ['title', 'slug', 'displayOrder', 'updatedAt'],
		description: '가이드라인 상위 내비게이션 섹션입니다.',
		listSearchableFields: ['title', 'slug'],
	},
	versions: {
		drafts: {
			schedulePublish: true,
		},
		maxPerDoc: 50,
	},
	defaultSort: 'displayOrder',
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
			localized: true,
			admin: {
				description: '사이드바 상위 섹션 제목으로 표시됩니다.',
			},
		},
		slugField({
			useAsSlug: 'title',
			localized: true,
			required: true,
		}),
		{
			name: 'description',
			type: 'textarea',
			localized: true,
			admin: {
				position: 'sidebar',
				description: '섹션 랜딩 페이지에 표시할 선택 요약입니다.',
			},
		},
		{
			name: 'pages',
			type: 'join',
			collection: 'guideline-pages',
			on: 'section',
		},
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: {
				position: 'sidebar',
				description: '숫자가 낮을수록 가이드라인 내비게이션에서 먼저 표시됩니다.',
			},
		},
	],
}
