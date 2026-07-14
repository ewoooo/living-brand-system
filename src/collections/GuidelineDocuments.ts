import { createBreadcrumbsField, createParentField } from '@payloadcms/plugin-nested-docs'
import { type CollectionConfig, slugField } from 'payload'
import { guidelineBlocks, guidelineChecksField } from '@/blocks/guideline'
import { validateGuidelineCheckKeys } from '@/features/guideline/checks/validate-guideline-check-keys'
import { validateGuidelineDocumentDepth } from '@/features/guideline/checks/validate-guideline-document-depth'
import { validateGuidelineDocumentSlug } from '@/features/guideline/checks/validate-guideline-document-slug'
import { managerManagedAccess } from '@/lib/auth'
import { guidelineDraftVersions } from './shared'

const previewURL = (id: unknown) =>
	typeof id === 'number' || typeof id === 'string'
		? `/api/guideline-preview?id=${encodeURIComponent(String(id))}`
		: null

export const GuidelineDocuments: CollectionConfig = {
	slug: 'guideline-documents',
	dbName: 'guideline_docs',
	access: managerManagedAccess,
	hooks: {
		beforeValidate: [validateGuidelineDocumentDepth, validateGuidelineCheckKeys],
	},
	labels: {
		singular: 'Guideline Document',
		plural: 'Guideline Documents',
	},
	admin: {
		group: 'Guidelines',
		useAsTitle: 'title',
		description: '계층형 가이드라인 문서입니다.',
		components: {
			edit: {
				PublishButton: '/components/admin/BetterEditorPublishButton',
			},
			views: {
				list: {
					Component: '/components/admin/GuidelineDocumentTreeList',
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
		{
			name: 'documentLocation',
			type: 'ui',
			admin: {
				components: {
					Field: '/components/admin/GuidelineDocumentLocation',
				},
			},
		},
		createParentField('guideline-documents', {
			label: '상위 문서',
			admin: {
				position: 'main',
				description:
					'상위 문서가 없으면 챕터, 챕터 아래는 섹션, 섹션 아래는 페이지가 됩니다.',
			},
		}),
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
				description: '문서 헤더에 표시할 선택 이미지입니다.',
			},
		},
		{
			name: 'blocks',
			type: 'blocks',
			label: '본문',
			blocks: guidelineBlocks,
			admin: {
				components: {
					Field: '/components/admin/GuidelineBlocksField',
				},
			},
		},
		guidelineChecksField(),
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
		createBreadcrumbsField('guideline-documents', {
			admin: {
				hidden: true,
			},
		}),
	],
}
