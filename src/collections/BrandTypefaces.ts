import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const BrandTypefaces: CollectionConfig = {
	slug: 'brand-typefaces',
	access: managerManagedAccess,
	labels: {
		singular: 'Brand Typeface',
		plural: 'Brand Typefaces',
	},
	admin: {
		group: 'Brand Assets',
		useAsTitle: 'name',
		defaultColumns: ['name', 'familyName', 'updatedAt'],
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
			name: 'familyName',
			type: 'text',
			required: true,
		},
	],
}
