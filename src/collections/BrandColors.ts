import type { CollectionConfig } from 'payload'

export const BrandColors: CollectionConfig = {
	slug: 'brand-colors',
	labels: {
		singular: 'Color',
		plural: 'Colors',
	},
	admin: {
		group: 'Brand Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'hex', 'updatedAt'],
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
			name: 'hex',
			type: 'text',
			required: true,
		},
	],
}
