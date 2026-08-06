import type { CollectionConfig, FieldAccess } from 'payload'
import {
	IMAGE_ASPECT_RATIO_OPTIONS,
	IMAGE_OUTPUT_SIZE_OPTIONS,
} from '@/features/generate-image/image-size'
import { isManager } from '@/lib/auth'
import { templateAssetReferenceGuardHooks } from '@/services/guard-template-references.service'
import { draftVersions } from './shared'

const managerFieldRead: FieldAccess = ({ req }) => isManager(req.user)

export const GeneratedImages: CollectionConfig = {
	slug: 'generated-images',
	labels: {
		singular: '생성 이미지',
		plural: '생성 이미지',
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
	],
	upload: {
		mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
	},
	timestamps: true,
}
