import type { GlobalConfig } from 'payload'

export const Guideline: GlobalConfig = {
	slug: 'guideline',
	label: 'Guideline',
	admin: {
		group: 'Guideline',
	},
	versions: {
		drafts: {
			schedulePublish: true,
		},
		max: 50,
	},
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			localized: true,
		},
		{
			name: 'purpose',
			type: 'textarea',
			localized: true,
		},
		{
			name: 'brandName',
			type: 'text',
			required: true,
			index: true,
		},
	],
}
