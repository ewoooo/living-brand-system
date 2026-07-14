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
		components: {
			edit: {
				// 저장 컨트롤 옆 [검수] 버튼 + (검수통과 && 수정없음)일 때만 여는 게시 버튼.
				beforeDocumentControls: ['/features/template-import/components/review-gate-button'],
				PublishButton: '/features/template-import/components/review-gated-publish-button',
			},
		},
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
			// 워크스페이스: 캔버스 + 레이어 목록 + 값 편집을 한 컴포넌트가 렌더한다.
			name: 'templateLayers',
			type: 'ui',
			admin: {
				components: {
					Field: '/features/template-import/components/template-layers-field',
				},
			},
		},
		// 레거시 절대좌표 모델 — 폼에서 숨김(컬럼·기존 데이터 유지). 신규 템플릿은 html을 쓴다.
		{ name: 'jsonTemplate', type: 'json', admin: { hidden: true } },
		// 기능 코드(css/js) — manager가 코드를 쓰지 않으므로 폼에서 숨김(컬럼·샌드박스 읽기 유지).
		{
			name: 'code',
			type: 'group',
			admin: { hidden: true },
			fields: [
				{ name: 'css', type: 'code', admin: { language: 'css' } },
				{ name: 'js', type: 'code', admin: { language: 'javascript' } },
			],
		},
		// 출처 URL. 입력창은 사이드바의 Figma 가져오기 필드와 통합했으므로 폼에서 숨긴다(컬럼·값 유지).
		{ name: 'sourceUrl', type: 'text', admin: { hidden: true } },

		// ── 사이드바 (렌더 순서 = 배열 순서) ──
		{
			type: 'row',
			admin: { position: 'sidebar' },
			fields: [
				{
					name: 'width',
					type: 'number',
					admin: { width: '50%', description: 'Figma 너비(px). 가져오기가 채웁니다.' },
				},
				{
					name: 'height',
					type: 'number',
					admin: { width: '50%', description: 'Figma 높이(px). 가져오기가 채웁니다.' },
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
			name: 'dividerChecks',
			type: 'ui',
			admin: {
				position: 'sidebar',
				components: { Field: '/features/template-import/components/sidebar-divider' },
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
			name: 'dividerImport',
			type: 'ui',
			admin: {
				position: 'sidebar',
				components: { Field: '/features/template-import/components/sidebar-divider' },
			},
		},
		{
			// sourceUrl 입력 + 가져오기 버튼을 겸한다(입력창은 sourceUrl 폼 필드를 편집).
			name: 'figmaHtmlImport',
			type: 'ui',
			admin: {
				position: 'sidebar',
				components: {
					Field: '/features/template-import/components/figma-html-import-field',
				},
			},
		},
		{
			// Figma Dev Mode 산출을 그대로 굳힌 inline-style HTML. 가져오기 필드가 채우며, 렌더는 이 값을 그대로 쓴다.
			type: 'collapsible',
			label: '디자인 HTML (Figma import)',
			admin: { position: 'sidebar', initCollapsed: true },
			fields: [
				{
					name: 'html',
					type: 'code',
					admin: {
						language: 'html',
						description:
							'Figma에서 가져온 inline-style HTML. 위 "가져오기"가 채웁니다. 렌더는 이 값을 그대로 사용합니다.',
					},
				},
			],
		},
	],
}
