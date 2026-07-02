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
	],
}
