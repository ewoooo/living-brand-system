import { type CollectionConfig, slugField } from 'payload'

export const GuidelinePages: CollectionConfig = {
	slug: 'guideline-pages',
	labels: {
		singular: 'Page',
		plural: 'Pages',
	},
	admin: {
		group: 'Guideline',
		useAsTitle: 'title',
		defaultColumns: ['title', 'section', 'composition', 'displayOrder', 'updatedAt'],
		description: '정책 본문과 레이아웃 구성을 가진 가이드라인 페이지입니다.',
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
				description: '가이드라인 화면의 페이지 제목으로 표시됩니다.',
			},
		},
		slugField({
			useAsSlug: 'title',
			localized: true,
			required: true,
		}),
		{
			name: 'section',
			type: 'relationship',
			relationTo: 'sections',
			required: true,
			index: true,
			admin: {
				position: 'sidebar',
				description: '사이드바 내비게이션과 URL에 사용할 상위 섹션입니다.',
			},
		},
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: {
				position: 'sidebar',
				description: '숫자가 낮을수록 선택한 섹션 안에서 먼저 표시됩니다.',
			},
		},
		{
			name: 'composition',
			type: 'relationship',
			relationTo: 'compositions',
			required: true,
			admin: {
				position: 'sidebar',
				description: '이 페이지를 렌더링할 프론트엔드 레이아웃입니다.',
			},
		},
		{
			name: 'policy',
			type: 'group',
			admin: {
				description: '이 가이드라인 페이지가 소유하는 본문 정책입니다.',
			},
			fields: [
				{
					name: 'body',
					type: 'richText',
					localized: true,
					admin: {
						description: '이 페이지의 정책 본문을 붙여넣거나 작성합니다.',
					},
				},
			],
		},
	],
}
