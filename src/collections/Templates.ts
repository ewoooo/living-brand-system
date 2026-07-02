import type { CollectionConfig } from 'payload'
import { authenticated, managerOrAdmin } from '@/lib/auth'

export const Templates: CollectionConfig = {
	slug: 'templates',
	access: {
		// 누구나 읽되(인증), 자원 변경은 manager/admin만 (Worker는 사용만)
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	labels: {
		singular: 'Template',
		plural: 'Templates',
	},
	admin: {
		group: 'Production Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'sourceType', 'updatedAt'],
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
		},
		{
			name: 'description',
			type: 'textarea',
			localized: true,
		},
		{
			name: 'sourceType',
			type: 'select',
			required: true,
			options: [
				{ label: 'Figma', value: 'figma' },
				{ label: 'File', value: 'file' },
			],
		},
		{
			name: 'figmaImport',
			type: 'ui',
			admin: {
				condition: (data) => data?.sourceType === 'figma',
				components: {
					Field: '/features/template-import/components/figma-import-field',
				},
			},
		},
		{
			name: 'templatePreview',
			type: 'ui',
			admin: {
				components: {
					Field: '/features/template-import/components/template-preview-field',
				},
			},
		},
		{
			name: 'jsonTemplate',
			type: 'json',
			admin: {
				description:
					'렌더 계약(JsonTemplate). 임포트가 생성하며, 수정 시 src/types/json-template.ts 스키마를 지켜야 합니다.',
			},
		},
		{
			name: 'sourceUrl',
			type: 'text',
			admin: {
				position: 'sidebar',
				description:
					'임포트에 사용한 Figma URL 원문입니다. 출처 기록용이며 재동기화하지 않습니다.',
			},
		},
	],
}
