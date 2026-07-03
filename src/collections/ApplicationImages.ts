import type { CollectionConfig } from 'payload'
import { draftVersions } from './shared'

export const ApplicationImages: CollectionConfig = {
	slug: 'application-images',
	labels: {
		singular: 'Application Image',
		plural: 'Application Images',
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
				fit: 'cover',
			},
		],
		adminThumbnail: 'thumbnail',
		focalPoint: true,
		crop: true,
		mimeTypes: ['image/*'],
	},
}
