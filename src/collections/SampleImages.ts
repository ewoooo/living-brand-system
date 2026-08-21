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
		{
			name: 'group',
			type: 'text',
			label: '분류',
			admin: {
				description:
					'스튜디오 자산 브라우저의 태그 필터에 쓰는 분류입니다(예: 엔진). 비워 두면 필터에 나타나지 않습니다.',
			},
		},
		{
			name: 'lineArt',
			type: 'checkbox',
			defaultValue: false,
			label: '선화',
			admin: {
				description:
					'흰 바탕에 선으로만 그린 이미지입니다. 켜면 템플릿 슬롯에서 프로파일의 색 조정이 이 이미지에도 걸립니다. 사진에 켜면 두 색으로 뭉개집니다.',
			},
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
