import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'

export const TemplateRules: CollectionConfig = {
	slug: 'template-rules',
	access: managerManagedAccess,
	labels: {
		singular: 'Template Rule',
		plural: 'Template Rules',
	},
	admin: {
		group: 'Production Resources',
		useAsTitle: 'title',
		defaultColumns: ['title', 'status', 'updatedAt'],
		description: 'Agent가 템플릿으로 산출물을 만들 때 참고하는 생성 지침입니다.',
		listSearchableFields: ['title', 'description', 'body'],
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
			localized: true,
		},
		{
			name: 'description',
			type: 'textarea',
			localized: true,
		},
		{
			name: 'body',
			type: 'textarea',
			required: true,
			localized: true,
			admin: {
				description: '템플릿 선택, 슬롯 채우기, 생성 응답 시 따라야 할 지침입니다.',
			},
		},
		{
			name: 'status',
			type: 'select',
			defaultValue: 'live',
			options: ['draft', 'live', 'archived'],
			admin: {
				position: 'sidebar',
			},
		},
	],
}
