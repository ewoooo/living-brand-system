import type { CollectionConfig } from 'payload'
import { authenticated, managerOrAdmin } from '@/lib/auth'

export const Plugins: CollectionConfig = {
	slug: 'plugins',
	access: {
		// 누구나 읽되(인증), 자원 변경은 manager/admin만 (Worker는 사용만)
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	labels: {
		singular: 'Plugin',
		plural: 'Plugins',
	},
	admin: {
		group: 'Production Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'pluginType', 'updatedAt'],
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
			name: 'pluginType',
			type: 'select',
			required: true,
			options: [
				{ label: 'Generator', value: 'generator' },
				{ label: 'Checker', value: 'checker' },
			],
		},
	],
}
