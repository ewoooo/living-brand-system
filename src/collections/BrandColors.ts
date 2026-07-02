import type { CollectionConfig } from 'payload'
import { authenticated, managerOrAdmin } from '@/lib/auth'

export const BrandColors: CollectionConfig = {
	slug: 'brand-colors',
	access: {
		// 누구나 읽되(인증), 자원 변경은 manager/admin만 (Worker는 사용만)
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	labels: {
		singular: 'Color',
		plural: 'Colors',
	},
	admin: {
		group: 'Brand Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'hex', 'updatedAt'],
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
			name: 'hex',
			type: 'text',
			required: true,
		},
	],
}
