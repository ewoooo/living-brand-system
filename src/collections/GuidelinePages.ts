import { type CollectionConfig, slugField } from 'payload'

export const GuidelinePages: CollectionConfig = {
	slug: 'guideline-pages',
	labels: {
		singular: 'Page',
		plural: 'Pages',
	},
	admin: {
		group: 'Guideline',
		useAsTitle: 'title',
		defaultColumns: ['title', 'section', 'composition', 'displayOrder', 'updatedAt'],
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
		slugField({
			useAsSlug: 'title',
			localized: true,
			required: true,
		}),
		{
			name: 'section',
			type: 'relationship',
			relationTo: 'sections',
			required: true,
			index: true,
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
		{
			name: 'composition',
			type: 'relationship',
			relationTo: 'compositions',
			required: true,
			admin: {
				position: 'sidebar',
			},
		},
		{
			name: 'policy',
			type: 'group',
			fields: [
				{
					name: 'title',
					type: 'text',
					localized: true,
				},
				{
					name: 'body',
					type: 'richText',
					localized: true,
				},
			],
		},
	],
}
