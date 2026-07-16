import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const BrandTypefaces: CollectionConfig = {
	slug: 'brand-typefaces',
	access: managerManagedAccess,
	labels: {
		singular: '서체',
		plural: '서체',
	},
	admin: {
		group: '브랜드 자원',
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
