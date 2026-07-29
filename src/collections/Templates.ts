import { APIError, type CollectionConfig } from 'payload'
import {
	findPrintOutputBlocker,
	MAX_PRINT_PIXELS,
	PRINT_PPI_OPTIONS,
} from '@/features/asset-generation/print-output'
import { publishImportedFigmaAssets } from '@/features/template-import/repositories/figma-imported-asset.payload.repository'
import {
	findTemplateDraftBlocker,
	findTemplatePublishBlocker,
} from '@/features/template-import/services/validate-template-publish.service'
import {
	inspectBaseTemplateHtml,
	inspectDraftTemplateAssetRefs,
} from '@/features/template-import/utils/validate-template-html'
import { isManager, managerOrAdmin } from '@/lib/auth'
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
				const candidate = {
					...originalDoc,
					...data,
				}
				const draftBlocker = findTemplateDraftBlocker(candidate)
				if (draftBlocker) throw new APIError(draftBlocker, 400)
				const printBlocker = findPrintOutputBlocker(candidate)
				if (printBlocker) throw new APIError(printBlocker, 400)

				// Draft는 구조 안전성까지만 검사한다. live published 문서의 부분 update는 다시 발행 검증한다.
				const finalStatus = data?._status ?? originalDoc?._status
				if (finalStatus !== 'published') return data

				// baseHtml의 Figma import refs 중 최종 html에도 남은 draft만 승인한다.
				// 같은 req를 전달하므로 뒤의 Template 검증/저장이 실패하면 에셋 승격도 함께 롤백된다.
				const importedRefs =
					typeof candidate.baseHtml === 'string'
						? inspectBaseTemplateHtml(candidate.baseHtml).refs
						: []
				const renderedRefs =
					typeof candidate.html === 'string'
						? inspectDraftTemplateAssetRefs(candidate.html).refs
						: []
				await publishImportedFigmaAssets(
					req,
					importedRefs
						.filter(
							(imported) =>
								imported.collection === 'application-images' &&
								renderedRefs.some(
									(rendered) =>
										rendered.collection === imported.collection &&
										rendered.assetId === imported.assetId &&
										rendered.src === imported.src,
								),
						)
						.map((ref) => ref.assetId),
				)

				const blocker = await findTemplatePublishBlocker(candidate, req)
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
		{ name: 'overrides', type: 'json', admin: { hidden: true } },

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
				description: `설정하면 CMYK TIFF 내보내기가 활성화됩니다. 픽셀 크기는 유지되며 최대 ${MAX_PRINT_PIXELS.toLocaleString('en-US')}픽셀을 지원합니다.`,
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
