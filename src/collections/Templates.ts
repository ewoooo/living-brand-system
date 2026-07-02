import { APIError, type CollectionConfig } from 'payload'
import { findUnauthorizedTemplateImages } from '@/features/template-import/services/validate-authorized-assets'
import { authenticated, managerOrAdmin } from '@/lib/auth'

export const Templates: CollectionConfig = {
	slug: 'templates',
	access: {
		// 누구나 읽되(인증), 자원 변경은 manager/admin만 (Worker는 사용만)
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	hooks: {
		// 보안/브랜드 통제: 이미지·벡터는 인가된 내부 에셋만 허용한다.
		// 임포트 조각(template-assets)이 남아 있으면 draft를 포함해 어떤 저장도 거부한다 (docs/07).
		beforeChange: [
			({ data }) => {
				const unauthorized = findUnauthorizedTemplateImages(data?.jsonTemplate)

				if (unauthorized.length > 0) {
					throw new APIError(
						`인가된 에셋으로 교체되지 않은 이미지가 있습니다: ${unauthorized.join(', ')}. 미리보기에서 각 이미지를 브랜드 에셋으로 교체한 뒤 저장하세요.`,
						400,
					)
				}

				return data
			},
		],
	},
	labels: {
		singular: 'Template',
		plural: 'Templates',
	},
	admin: {
		group: 'Production Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'sourceType', 'updatedAt'],
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
			name: 'description',
			type: 'textarea',
			localized: true,
		},
		{
			name: 'sourceType',
			type: 'select',
			required: true,
			options: [
				{ label: 'Figma', value: 'figma' },
				{ label: 'File', value: 'file' },
			],
		},
		{
			name: 'figmaImport',
			type: 'ui',
			admin: {
				condition: (data) => data?.sourceType === 'figma',
				components: {
					Field: '/features/template-import/components/figma-import-field',
				},
			},
		},
		{
			name: 'templatePreview',
			type: 'ui',
			admin: {
				components: {
					Field: '/features/template-import/components/template-preview-field',
				},
			},
		},
		{
			name: 'jsonTemplate',
			type: 'json',
			admin: {
				description:
					'렌더 계약(JsonTemplate). 임포트가 생성하며, 수정 시 src/types/json-template.ts 스키마를 지켜야 합니다.',
			},
		},
		{
			name: 'category',
			type: 'relationship',
			relationTo: 'template-categories',
			required: true,
			index: true,
			admin: {
				position: 'sidebar',
				description: 'Create 화면 사이드바에서 이 템플릿이 속할 카테고리입니다.',
			},
		},
		{
			name: 'sourceUrl',
			type: 'text',
			admin: {
				position: 'sidebar',
				description:
					'임포트에 사용한 Figma URL 원문입니다. 출처 기록용이며 재동기화하지 않습니다.',
			},
		},
	],
}
