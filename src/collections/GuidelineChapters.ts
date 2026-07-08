import { type CollectionConfig, slugField } from 'payload'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const GuidelineChapters: CollectionConfig = {
	slug: 'chapters',
	dbName: 'guideline_chapters',
	access: managerManagedAccess,
	labels: {
		singular: 'Guideline Chapter',
		plural: 'Guideline Chapters',
	},
	admin: {
		group: 'Guidelines',
		useAsTitle: 'title',
		defaultColumns: ['title', 'slug', 'displayOrder', 'updatedAt'],
		description: '가이드라인 최상위 장입니다. 하위에 섹션을 가집니다.',
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
				description: '사이드바 최상위 장 제목으로 표시됩니다.',
			},
		},
		slugField({
			useAsSlug: 'title',
			localized: true,
			required: true,
		}),
		{
			name: 'description',
			type: 'textarea',
			localized: true,
			admin: {
				position: 'sidebar',
				description: '장 랜딩 페이지에 표시할 선택 요약입니다.',
			},
		},
		{
			name: 'sections',
			type: 'join',
			collection: 'sections',
			on: 'chapter',
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
