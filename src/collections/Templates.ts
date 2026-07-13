import { APIError, type CollectionConfig } from 'payload'
import { findInvalidAuthorizedRefs } from '@/features/template-import/services/validate-authorized-refs.service'
import { validateTemplateImages } from '@/features/template-import/utils/validate-authorized-assets'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const Templates: CollectionConfig = {
	slug: 'templates',
	access: managerManagedAccess,
	hooks: {
		// 보안/브랜드 통제: 이미지·벡터는 인가된 내부 에셋만 허용한다.
		// 인가 검사는 발행 시에만 한다 — draft 저장은 충실 import를 위해 항상 통과하고,
		// worker/공개 페이지는 발행본만 읽으므로 비인가 draft가 외부로 새지 않는다 (docs/07).
		beforeChange: [
			async ({ data, req }) => {
				// draft(및 상태 미지정) 저장은 게이트 없이 통과. 발행 전이일 때만 인가 검증.
				if (data?._status !== 'published') return data

				const validation = validateTemplateImages(data?.jsonTemplate)

				// 보안 게이트는 fail-closed — 검사할 수 없는 값은 저장하지 않는다.
				if (validation.status === 'invalid') {
					throw new APIError(
						'jsonTemplate이 스키마(src/types/json-template.ts)와 맞지 않아 저장할 수 없습니다.',
						400,
					)
				}
				if (validation.unauthorizedLabels.length > 0) {
					throw new APIError(
						`인가된 에셋으로 교체되지 않은 이미지가 있습니다: ${validation.unauthorizedLabels.join(', ')}. 미리보기에서 각 이미지를 브랜드 에셋으로 교체한 뒤 저장하세요.`,
						400,
					)
				}

				// 인가 컬렉션은 자기신고 라벨이 아니라 실제 문서 참조로 검증한다.
				const invalidRefLabels = await findInvalidAuthorizedRefs(
					req.payload,
					validation.authorizedRefs,
				)

				if (invalidRefLabels.length > 0) {
					throw new APIError(
						`인가 에셋 참조가 유효하지 않습니다: ${invalidRefLabels.join(', ')}. 미리보기에서 에셋을 다시 선택하세요.`,
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
		group: 'Production',
		useAsTitle: 'name',
		defaultColumns: ['name', 'updatedAt'],
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
			name: 'description',
			type: 'textarea',
			localized: true,
		},
		{
			name: 'figmaImport',
			type: 'ui',
			admin: {
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
			type: 'collapsible',
			label: '구조 (디자인 레이아웃)',
			admin: { initCollapsed: true },
			fields: [
				{
					name: 'jsonTemplate',
					type: 'json',
					admin: {
						description:
							'렌더 계약(JsonTemplate). 임포트가 생성하며, 수정 시 src/types/json-template.ts 스키마를 지켜야 합니다.',
					},
				},
			],
		},
		{
			// 기능(코드) 층. 디자인 구조(jsonTemplate)와 분리해 실제 코드로 저장한다(json 이스케이프 없음).
			// 특정 배치·동작이 필요할 때만 작성하고, 비우면 정적 디자인으로 동작한다. iframe 샌드박스에서 실행된다.
			type: 'collapsible',
			label: '기능 코드 (선택)',
			admin: { initCollapsed: true },
			fields: [
				{
					name: 'code',
					type: 'group',
					admin: {
						description:
							'디자인 위에 얹을 css/js. 비우면 정적 디자인. js가 있으면 샌드박스로 실행됩니다.',
					},
					fields: [
						{ name: 'css', type: 'code', admin: { language: 'css' } },
						{ name: 'js', type: 'code', admin: { language: 'javascript' } },
					],
				},
			],
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
			name: 'templateChecks',
			type: 'array',
			admin: {
				position: 'sidebar',
				description: 'Agent가 이 템플릿으로 이미지를 만들 때 함께 참고할 Check입니다.',
			},
			fields: [
				{
					name: 'checkKey',
					type: 'text',
					required: true,
					admin: {
						description: 'published 가이드라인 checks[]의 key를 입력합니다.',
					},
				},
				{
					name: 'body',
					type: 'textarea',
					required: true,
					localized: true,
					admin: {
						description:
							'이 템플릿에서 해당 Check를 적용할 때 Agent가 참고할 지침입니다.',
					},
				},
			],
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
