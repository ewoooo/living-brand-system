import type { CollectionConfig } from 'payload'
import { isManager, managerOrAdmin } from '@/lib/auth'
import { draftVersions } from './shared'

export const BrandLogos: CollectionConfig = {
	slug: 'brand-logos',
	labels: {
		singular: '로고',
		plural: '로고',
	},
	access: {
		// 공개 화면은 발행본만 읽고, manager/admin은 Admin에서 draft까지 관리한다.
		read: ({ req }) =>
			isManager(req.user) || {
				_status: { equals: 'published' },
			},
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	admin: {
		group: '브랜드 자원',
		useAsTitle: 'name',
		defaultColumns: ['filename', 'name', 'alt', 'updatedAt'],
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
