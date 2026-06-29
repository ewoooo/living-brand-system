import type { CollectionConfig } from 'payload'

export const Plugins: CollectionConfig = {
	slug: 'plugins',
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
