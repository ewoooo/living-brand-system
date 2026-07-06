import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const Plugins: CollectionConfig = {
	slug: 'plugins',
	access: managerManagedAccess,
	labels: {
		singular: 'Plugin',
		plural: 'Plugins',
	},
	admin: {
		group: 'Production',
		useAsTitle: 'name',
		defaultColumns: ['name', 'pluginType', 'updatedAt'],
	},
	versions: draftVersions,
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
