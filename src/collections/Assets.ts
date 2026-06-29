import type { CollectionConfig } from 'payload'
import { authenticated, managerOrAdmin } from '@/lib/auth'

export const Assets: CollectionConfig = {
	slug: 'assets',
	access: {
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	admin: {
		group: 'Assets',
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
