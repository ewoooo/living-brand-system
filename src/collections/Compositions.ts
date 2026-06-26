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
			name: 'layoutType',
			type: 'select',
			required: true,
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
		},
	],
}
