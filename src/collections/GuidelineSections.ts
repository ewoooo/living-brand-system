import type { CollectionConfig } from 'payload'

export const GuidelineSections: CollectionConfig = {
	slug: 'sections',
	dbName: 'guideline_sections',
	labels: {
		singular: 'Section',
		plural: 'Sections',
	},
	admin: {
		group: 'Guideline',
		useAsTitle: 'title',
		defaultColumns: ['title', 'displayOrder', 'updatedAt'],
	},
	versions: {
		drafts: {
			schedulePublish: true,
		},
		maxPerDoc: 50,
	},
	defaultSort: 'displayOrder',
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
			admin: {
				position: 'sidebar',
			},
		},
		{
			name: 'pages',
			type: 'join',
			collection: 'guideline-pages',
			on: 'section',
		},
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: {
				position: 'sidebar',
			},
		},
	],
}
