import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const BrandColors: CollectionConfig = {
	slug: 'brand-colors',
	access: managerManagedAccess,
	labels: {
		singular: 'Color',
		plural: 'Colors',
	},
	admin: {
		group: 'Brand Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'hex', 'updatedAt'],
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
			name: 'hex',
			type: 'text',
			required: true,
		},
	],
}
