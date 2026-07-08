import { type CollectionConfig, slugField } from 'payload'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const GuidelineSections: CollectionConfig = {
	slug: 'sections',
	dbName: 'guideline_sections',
	access: managerManagedAccess,
	labels: {
		singular: 'Guideline Section',
		plural: 'Guideline Sections',
	},
	admin: {
		group: 'Guidelines',
		useAsTitle: 'title',
		defaultColumns: ['title', 'chapter', 'slug', 'displayOrder', 'updatedAt'],
		description: '장 하위 섹션입니다. 상위 장에 속하며 하위에 페이지를 가집니다.',
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
			admin: {
				description: '사이드바 상위 섹션 제목으로 표시됩니다.',
			},
		},
		slugField({
			useAsSlug: 'title',
			localized: true,
			required: true,
		}),
		{
			name: 'chapter',
			type: 'relationship',
			relationTo: 'chapters',
			required: true,
			index: true,
			admin: {
				position: 'sidebar',
				description: '사이드바 내비게이션과 URL에 사용할 상위 장입니다.',
			},
		},
		{
			name: 'description',
			type: 'textarea',
			localized: true,
			admin: {
				position: 'sidebar',
				description: '섹션 랜딩 페이지에 표시할 선택 요약입니다.',
			},
		},
		{
			name: 'pages',
			type: 'join',
			collection: 'guideline-pages',
			on: 'section',
		},
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: {
				position: 'sidebar',
				description: '숫자가 낮을수록 가이드라인 내비게이션에서 먼저 표시됩니다.',
			},
		},
	],
}
