import type { CollectionConfig } from 'payload'
import { templateAssetReferenceGuardHooks } from '@/features/template-core/services/guard-template-references.service'
import { isManager, managerOrAdmin } from '@/lib/auth'
import { draftVersions } from './shared'

/**
 * 생성하지 않고 그대로 가져다 쓰는 완성 이미지. 템플릿의 배경·이미지 슬롯이 Preset으로 고른다.
 * `generated-images`(AI 산출물)와 나누는 기준은 출처다 — 이쪽은 계보도 프로파일도 없다.
 */
export const SampleImages: CollectionConfig = {
	slug: 'sample-images',
	labels: {
		singular: '샘플 이미지',
		plural: '샘플 이미지',
	},
	// 발행 템플릿이 파일 URL을 참조 중이면 삭제·발행 해제를 거부한다.
	hooks: templateAssetReferenceGuardHooks('sample-images'),
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
