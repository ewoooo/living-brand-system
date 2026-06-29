import type { CollectionConfig } from 'payload'

export const BrandTypefaces: CollectionConfig = {
	slug: 'brand-typefaces',
	labels: {
		singular: 'Typeface',
		plural: 'Typefaces',
	},
	admin: {
		group: 'Brand Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'familyName', 'updatedAt'],
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
			name: 'familyName',
			type: 'text',
			required: true,
		},
	],
}
