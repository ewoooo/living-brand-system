import { APIError, type CollectionConfig } from 'payload'
import {
	MAX_PRINT_PIXELS,
	MAX_PRINT_SIDE_PIXELS,
	PRINT_PPI_OPTIONS,
} from '@/features/template-export/print-policy'
import { prepareTemplateSave } from '@/features/template-import/services/prepare-template-save.service'
import { isManager, managerOrAdmin } from '@/lib/auth'
import { studioControllerField } from './fields/studio-controller-field'
import { studioOutputField } from './fields/studio-output-field'
import { draftVersions } from './shared'

export const Templates: CollectionConfig = {
	slug: 'templates',
	access: {
		read: ({ req }) =>
			isManager(req.user) || {
				_status: { equals: 'published' },
			},
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	hooks: {
		// 모든 HTML 저장은 실행 마크업과 외부 URL을 차단한다. 브랜드 에셋 published 검증은
		// 발행 시에만 추가하고, draft의 staging 에셋은 manager/admin에게만 보인다 (docs/07).
		beforeChange: [
			async ({ data, originalDoc, req }) => {
				const blocker = await prepareTemplateSave({ data, originalDoc, req })
				if (blocker) throw new APIError(blocker, 400)

				return data
			},
		],
	},
	labels: {
		singular: '템플릿',
		plural: '템플릿',
	},
	admin: {
		group: '제작 도구',
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
		studioControllerField({
			description:
				'비우면 템플릿 슬롯에서 기본 계약을 만듭니다. 같은 그룹·컨트롤 ID의 options, 범위, 기본값, 사용 상태만 좁힐 수 있습니다.',
		}),
		studioOutputField({
			formats: [
				{ label: 'PNG', value: 'png' },
				{ label: 'CMYK TIFF', value: 'tiff' },
				{ label: 'CMYK PDF', value: 'pdf' },
			],
		}),
		{
			// 워크스페이스: 캔버스 + 레이어 목록 + 값 편집을 한 컴포넌트가 렌더한다.
			name: 'templateLayers',
			type: 'ui',
			admin: {
				components: {
					Field: '/components/admin/templates/template-layers-field#TemplateLayersField',
				},
			},
		},
		// 출처 URL. 입력창은 사이드바의 Figma 가져오기 필드와 통합했으므로 폼에서 숨긴다(컬럼·값 유지).
		{
			name: 'sourceUrl',
			type: 'text',
			access: { read: ({ req }) => isManager(req.user) },
			admin: { hidden: true },
		},
		// 오버라이드 레이어: Figma import 원본(baseHtml) + 앱 편집(overrides). 렌더 html은 이 둘의 합성 결과다.
		// 재import는 baseHtml만 갱신하고 overrides를 유지 → html 재합성 → 앱 편집 보존.
		{
			name: 'baseHtml',
			type: 'code',
			access: { read: ({ req }) => isManager(req.user) },
			admin: { hidden: true, language: 'html' },
		},
		{
			// 저작 내부값(input.aiInstruction·generatedImageId·vectorAsset 등)을 담으므로 공개
			// REST(published read)에서 감춘다. 서버 신뢰 경로(published-template·agent-template
			// repository)는 overrideAccess: true의 local API로 읽어 영향이 없다.
			name: 'overrides',
			type: 'json',
			access: { read: ({ req }) => isManager(req.user) },
			admin: { hidden: true },
		},

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
			name: 'printPpi',
			type: 'select',
			options: [...PRINT_PPI_OPTIONS],
			admin: {
				position: 'sidebar',
				description: `설정하면 CMYK TIFF와 mm 단위 CMYK PDF가 활성화됩니다. 픽셀 크기는 유지되며 인쇄 출력은 최대 ${MAX_PRINT_PIXELS.toLocaleString('en-US')}픽셀, 너비·높이 각각 최대 ${MAX_PRINT_SIDE_PIXELS.toLocaleString('en-US')}px를 지원합니다.`,
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
			name: 'dividerChecks',
			type: 'ui',
			admin: {
				position: 'sidebar',
				components: { Field: '/components/admin/templates/sidebar-divider#SidebarDivider' },
			},
		},
		{
			name: 'dividerImport',
			type: 'ui',
			admin: {
				position: 'sidebar',
				components: { Field: '/components/admin/templates/sidebar-divider#SidebarDivider' },
			},
		},
		{
			// sourceUrl 입력 + 가져오기 버튼을 겸한다(입력창은 sourceUrl 폼 필드를 편집).
			name: 'figmaHtmlImport',
			type: 'ui',
			admin: {
				position: 'sidebar',
				components: {
					Field: '/components/admin/templates/figma-html-import-field#FigmaHtmlImportField',
				},
			},
		},
		{
			// 렌더 결과 HTML = baseHtml ⊕ overrides 합성물. 워크스페이스가 자동 재합성하므로 읽기 전용(직접 편집 X).
			type: 'collapsible',
			label: '디자인 HTML (합성 결과)',
			admin: { position: 'sidebar', initCollapsed: true },
			fields: [
				{
					name: 'html',
					type: 'code',
					admin: {
						language: 'html',
						readOnly: true,
						description:
							'baseHtml(Figma 원본) + overrides(앱 편집)의 합성 결과입니다. 워크스페이스 편집·재import 시 자동 갱신됩니다.',
					},
				},
			],
		},
	],
}
