import type { CollectionConfig } from 'payload'

export const Compositions: CollectionConfig = {
	slug: 'compositions',
	labels: {
		singular: 'Composition',
		plural: 'Compositions',
	},
	admin: {
		group: 'Guideline',
		useAsTitle: 'name',
		defaultColumns: ['name', 'layoutType', 'updatedAt'],
		description: '가이드라인 페이지에서 재사용하는 레이아웃 구성입니다.',
		listSearchableFields: ['name', 'layoutType'],
	},
	versions: {
		drafts: {
			schedulePublish: true,
		},
		maxPerDoc: 50,
	},
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			localized: true,
			admin: {
				description: '관리자가 구분할 수 있는 레이아웃 이름입니다.',
			},
		},
		{
			name: 'layoutType',
			type: 'select',
			required: true,
			admin: {
				description: '프론트엔드 렌더러가 사용하는 고정 레이아웃 키입니다.',
			},
			options: [
				{ label: 'Type A', value: 'type-a' },
				{ label: 'Type B', value: 'type-b' },
				{ label: 'Type C', value: 'type-c' },
				{ label: 'Type D', value: 'type-d' },
				{ label: 'Type E', value: 'type-e' },
			],
		},
		{
			name: 'description',
			type: 'textarea',
			localized: true,
			admin: {
				description: '이 구성을 언제 쓰는지 남기는 선택 메모입니다.',
			},
		},
	],
}
