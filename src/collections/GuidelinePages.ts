import { type CollectionConfig, slugField } from 'payload'
import { guidelineBlocks, guidelineChecksField } from '@/blocks/guideline'
import { validateGuidelineCheckKeys } from '@/features/guideline/checks/validate-guideline-check-keys'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

const previewURL = (id: unknown) =>
	typeof id === 'number' || typeof id === 'string'
		? `/api/guideline-preview?id=${encodeURIComponent(String(id))}`
		: null

export const GuidelinePages: CollectionConfig = {
	slug: 'guideline-pages',
	access: managerManagedAccess,
	hooks: {
		beforeValidate: [validateGuidelineCheckKeys],
	},
	labels: {
		singular: 'Guideline Page',
		plural: 'Guideline Pages',
	},
	admin: {
		group: 'Guidelines',
		useAsTitle: 'title',
		defaultColumns: ['title', 'section', 'displayOrder', 'updatedAt'],
		description: '블록으로 구성하는 가이드라인 페이지입니다.',
		listSearchableFields: ['title', 'slug'],
		livePreview: {
			url: ({ data }) => previewURL(data.id),
		},
		preview: (data) => previewURL(data.id),
	},
	versions: draftVersions,
	defaultSort: 'displayOrder',
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
			localized: true,
			admin: {
				description: '가이드라인 화면의 페이지 제목으로 표시됩니다.',
			},
		},
		slugField({
			useAsSlug: 'title',
			localized: true,
			required: true,
		}),
		{
			name: 'description',
			type: 'richText',
			localized: true,
			admin: {
				description: '페이지 제목 아래에 표시할 선택 설명입니다.',
			},
		},
		guidelineChecksField(),
		{
			name: 'section',
			type: 'relationship',
			relationTo: 'guideline-sections',
			required: true,
			index: true,
			admin: {
				position: 'sidebar',
				description: '사이드바 내비게이션과 URL에 사용할 상위 섹션입니다.',
			},
		},
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: {
				position: 'sidebar',
				description: '숫자가 낮을수록 선택한 섹션 안에서 먼저 표시됩니다.',
			},
		},
		{
			name: 'blocks',
			type: 'blocks',
			blocks: guidelineBlocks,
		},
	],
}
