import type { CollectionConfig } from 'payload'
import { templateAssetReferenceGuardHooks } from '@/features/template-core/services/guard-template-references.service'
import { isManager, managerOrAdmin } from '@/lib/auth'
import { draftVersions } from './shared'

export const ApplicationImages: CollectionConfig = {
	slug: 'application-images',
	labels: {
		singular: '브랜드 이미지',
		plural: '브랜드 이미지',
	},
	// 발행 템플릿이 파일 URL을 참조 중이면 삭제·발행 해제를 거부한다.
	hooks: templateAssetReferenceGuardHooks('application-images'),
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
				fit: 'cover',
			},
		],
		adminThumbnail: 'thumbnail',
		focalPoint: true,
		crop: true,
		mimeTypes: ['image/*'],
	},
}
