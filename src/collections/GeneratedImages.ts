import type { CollectionConfig, FieldAccess } from 'payload'
import {
	IMAGE_ASPECT_RATIO_OPTIONS,
	IMAGE_OUTPUT_SIZE_OPTIONS,
} from '@/features/image-generation/domain/image-size'
import { templateAssetReferenceGuardHooks } from '@/features/template-core/services/guard-template-references.service'
import { isManager } from '@/lib/auth'
import { draftVersions } from './shared'

const managerFieldRead: FieldAccess = ({ req }) => isManager(req.user)

export const GeneratedImages: CollectionConfig = {
	slug: 'generated-images',
	labels: {
		singular: '이미지 생성',
		plural: '이미지 생성',
	},
	access: {
		read: ({ req }) =>
			isManager(req.user) || {
				_status: { equals: 'published' },
			},
		// 생성·발행은 이미지 생성/템플릿 저장 service의 trusted write만 수행한다.
		create: () => false,
		update: () => false,
		delete: ({ req }) => isManager(req.user) && { _status: { equals: 'draft' } },
	},
	// 발행 템플릿이 파일 URL을 참조 중이면 삭제·발행 해제를 거부한다.
	// delete access가 draft만 허용해도 trusted write(overrideAccess) 경로가 있어 훅으로도 막는다.
	hooks: templateAssetReferenceGuardHooks('generated-images'),
	admin: {
		group: '운영 기록',
		useAsTitle: 'filename',
		defaultColumns: ['filename', 'scenarioName', 'model', 'createdBy', 'createdAt'],
		description: 'Studio 이미지 생성 결과와 생성 당시 입력·실행 조건을 보관합니다.',
	},
	versions: draftVersions,
	fields: [
		{
			name: 'scenario',
			type: 'relationship',
			relationTo: 'image-profiles',
			required: true,
			access: { read: managerFieldRead },
		},
		{
			name: 'scenarioName',
			type: 'text',
			required: true,
			access: { read: managerFieldRead },
			admin: {
				description: '생성 당시 이미지 프로파일 이름입니다.',
			},
		},
		{
			name: 'inputPrompt',
			type: 'textarea',
			required: true,
			access: { read: managerFieldRead },
			admin: {
				description: '사용자가 입력한 원본 프롬프트입니다.',
			},
		},
		{
			name: 'effectivePrompt',
			type: 'textarea',
			required: true,
			access: { read: managerFieldRead },
			admin: {
				description: '정규화 후 이미지 모델에 전달한 최종 프롬프트입니다.',
			},
		},
		{
			name: 'model',
			type: 'text',
			required: true,
			access: { read: managerFieldRead },
		},
		{
			name: 'aspectRatio',
			type: 'select',
			required: true,
			options: [...IMAGE_ASPECT_RATIO_OPTIONS],
			access: { read: managerFieldRead },
		},
		{
			name: 'imageSize',
			type: 'select',
			required: true,
			options: [...IMAGE_OUTPUT_SIZE_OPTIONS],
			access: { read: managerFieldRead },
		},
		{
			// 한 번의 생성 요청으로 함께 만들어진 이미지를 묶는 키 — 요청마다 새로 만든다.
			// 🔴 2026-09-21 이전 행에는 이 값이 없어서, 도입 마이그레이션이 같은 사용자·같은
			//    프롬프트·같은 프로파일이 30초 안에 이어진 묶음(최대 4장)으로 채워 넣었다.
			//    추론이므로 그 행들의 묶음은 실제 요청 단위와 다를 수 있다.
			name: 'batchKey',
			type: 'text',
			index: true,
			access: { read: managerFieldRead },
			admin: {
				position: 'sidebar',
				description: '한 번의 생성 요청으로 함께 만들어진 이미지를 묶는 키입니다.',
			},
		},
		{
			name: 'createdBy',
			type: 'relationship',
			relationTo: 'users',
			required: true,
			index: true,
			access: { read: managerFieldRead },
			admin: {
				position: 'sidebar',
				description: '생성 요청 당시 인증된 사용자 ID입니다.',
			},
		},
		{
			name: 'sourceImage',
			type: 'relationship',
			relationTo: 'generated-images',
			access: { read: managerFieldRead },
			admin: {
				position: 'sidebar',
				description: '이 이미지를 만들 때 참조한 원본 생성 이미지입니다.',
			},
		},
	],
	upload: {
		mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
	},
	timestamps: true,
}
