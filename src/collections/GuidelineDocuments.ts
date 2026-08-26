import { type CollectionConfig, slugField } from 'payload'
import { backgroundToneField, guidelineRulesField } from '@/features/guideline/blocks/shared/fields'
import { guidelineBlocks } from '@/features/guideline/catalog/schema.generated'
import { validateGuidelineDocumentSlug } from '@/features/guideline/checks/validate-guideline-document-slug'
import { managerManagedAccess } from '@/lib/auth'
import { guidelineDraftVersions } from './shared'

const previewURL = (id: unknown) =>
	typeof id === 'number' || typeof id === 'string'
		? `/api/guideline-documents/${encodeURIComponent(String(id))}/preview`
		: null

export const GuidelineDocuments: CollectionConfig = {
	slug: 'guideline-documents',
	dbName: 'guideline_docs',
	access: managerManagedAccess,
	labels: {
		singular: '가이드라인 토픽',
		plural: '가이드라인 토픽',
	},
	admin: {
		group: '가이드라인',
		useAsTitle: 'title',
		description: '챕터에 속한 가이드라인 토픽입니다. 본문의 꼭지는 섹션 블록입니다.',
		components: {
			edit: {
				PublishButton:
					'/components/admin/guideline-documents/better-editor-publish-button#BetterEditorPublishButton',
			},
			views: {
				list: {
					Component:
						'/components/admin/guideline-documents/guideline-document-tree-list#GuidelineDocumentTreeList',
				},
			},
		},
		livePreview: {
			url: ({ data }) => previewURL(data.id),
		},
		preview: (data) => previewURL(data.id),
	},
	versions: guidelineDraftVersions,
	defaultSort: 'displayOrder',
	fields: [
		// 🔴 챕터는 별도 컬렉션이다(2026-08-26). 계층을 문서 자기참조로 표현하던 시절에는
		//    최상위 문서가 곧 챕터였는데, 그 문서가 제목·slug 말고 아무것도 갖지 않아 분류를
		//    문서로 흉내내고 있었다. 이제 관계 하나로 말한다.
		{
			name: 'chapter',
			type: 'relationship',
			relationTo: 'guideline-chapters',
			required: true,
			admin: {
				position: 'main',
				description: '이 토픽이 속한 챕터입니다. URL의 첫 조각이 됩니다.',
			},
		},
		{
			name: 'title',
			type: 'text',
			required: true,
			localized: true,
		},
		{
			name: 'label',
			type: 'text',
			localized: true,
			admin: {
				hidden: true,
				description: '제목 위에 표시할 선택 라벨입니다.',
			},
		},
		slugField({
			disableUnique: true,
			useAsSlug: 'title',
			localized: true,
			required: true,
			overrides: (field) => {
				const slug = field.fields[1]
				if (slug && 'hooks' in slug) {
					slug.hooks = {
						...slug.hooks,
						beforeChange: [
							...(slug.hooks?.beforeChange ?? []),
							validateGuidelineDocumentSlug,
						],
					}
				}
				return field
			},
		}),
		{
			name: 'description',
			type: 'richText',
			localized: true,
			admin: {
				description: '문서 제목 아래에 표시할 선택 설명입니다.',
			},
		},
		{
			name: 'headerImage',
			type: 'upload',
			relationTo: 'application-images',
			admin: {
				position: 'sidebar',
				description: '문서 헤더에 표시할 선택 이미지입니다.',
			},
		},
		// 🔴 문서(Page)의 면은 블록의 면과 다른 것을 덮는다 — 제목·본문까지 한 덩어리로 감싼다
		//    (Figma 61:3299의 Article). 블록 면은 배치 영역에서 끊기므로 이것을 대신할 수 없다.
		{
			name: 'background',
			type: 'relationship',
			relationTo: 'brand-colors',
			admin: {
				position: 'sidebar',
				description: '문서 전체(제목·본문·블록)를 덮는 배경색입니다. 비우면 기본.',
			},
		},
		backgroundToneField({ sidebar: true }),
		{
			name: 'blocks',
			type: 'blocks',
			label: '본문',
			blocks: guidelineBlocks,
		},
		guidelineRulesField(),
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: {
				position: 'sidebar',
				description: '숫자가 낮을수록 같은 부모 아래에서 먼저 표시됩니다.',
			},
		},
	],
}
