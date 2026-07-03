import type { CollectionConfig } from 'payload'
import { draftVersions } from './shared'

export const BrandLogos: CollectionConfig = {
	slug: 'brand-logos',
	labels: {
		singular: 'Logo',
		plural: 'Logos',
	},
	access: {
		read: () => true,
	},
	admin: {
		group: 'Brand Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'alt', 'updatedAt'],
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
			name: 'alt',
			type: 'text',
			required: true,
			localized: true,
		},
	],
	upload: {
		imageSizes: [
			{
				name: 'thumbnail',
				width: 320,
				height: 240,
				fit: 'contain',
			},
		],
		adminThumbnail: 'thumbnail',
		mimeTypes: ['image/*'],
	},
}
