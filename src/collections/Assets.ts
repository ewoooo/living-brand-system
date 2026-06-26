import type { CollectionConfig } from 'payload'

export const Assets: CollectionConfig = {
	slug: 'assets',
	access: {
		read: () => true,
	},
	fields: [
		{
			name: 'alt',
			type: 'text',
			required: true,
		},
	],
	upload: true,
}
