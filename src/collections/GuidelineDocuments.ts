import { type CollectionConfig, slugField } from 'payload'
import { guidelineBlocks, guidelineChecksField } from '@/blocks/guideline'
import { validateGuidelineCheckKeys } from '@/features/guideline/checks/validate-guideline-check-keys'
import { validateGuidelineDocumentDepth } from '@/features/guideline/checks/validate-guideline-document-depth'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

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
		defaultColumns: ['title', 'parent', 'slug', 'displayOrder', 'updatedAt'],
		description: '장·섹션·페이지를 같은 구조로 관리하는 계층형 가이드라인 문서입니다.',
		listSearchableFields: ['title', 'slug'],
	},
	versions: draftVersions,
	defaultSort: 'displayOrder',
	fields: [
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
		// ponytail: 현재 slug는 전역 고유로 둔다. 실제 중복 경로가 필요할 때 parent+slug 복합 제약으로 바꾼다.
		slugField({
			useAsSlug: 'title',
			localized: true,
			required: true,
		}),
		{
			name: 'legacySlug',
			type: 'text',
			localized: true,
			index: true,
			admin: {
				hidden: true,
				readOnly: true,
			},
		},
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
		guidelineChecksField(),
		{
			name: 'blocks',
			type: 'blocks',
			blocks: guidelineBlocks,
		},
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
		{
			name: 'legacyCollection',
			type: 'select',
			index: true,
			options: ['guideline-chapters', 'guideline-sections', 'guideline-pages'],
			admin: {
				hidden: true,
				readOnly: true,
			},
		},
		{
			name: 'legacyId',
			type: 'number',
			index: true,
			admin: {
				hidden: true,
				readOnly: true,
			},
		},
	],
}
