import type { CollectionConfig } from 'payload'

export const Templates: CollectionConfig = {
	slug: 'templates',
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
