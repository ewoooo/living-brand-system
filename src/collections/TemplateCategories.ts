import { type CollectionConfig, slugField } from 'payload'
import { authenticated, managerOrAdmin } from '@/lib/auth'

/**
 * Create 화면 사이드바의 템플릿 분류 단위.
 * GuidelineSections → GuidelinePages 관계와 같은 방식으로 Templates가 category로 참조한다.
 */
export const TemplateCategories: CollectionConfig = {
	slug: 'template-categories',
	dbName: 'template_categories',
	labels: {
		singular: 'Template Category',
		plural: 'Template Categories',
	},
	access: {
		// 누구나 읽되(인증), 분류 변경은 manager/admin만 (Worker는 사용만)
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	admin: {
		group: 'Production Resources',
		useAsTitle: 'title',
		defaultColumns: ['title', 'slug', 'displayOrder', 'updatedAt'],
		description: 'Create 화면 사이드바에 표시할 템플릿 카테고리입니다.',
	},
	defaultSort: 'displayOrder',
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
			localized: true,
			admin: {
				description: '사이드바 카테고리 제목으로 표시됩니다.',
			},
		},
		slugField({
			useAsSlug: 'title',
			localized: true,
			required: true,
		}),
		{
			name: 'templates',
			type: 'join',
			collection: 'templates',
			on: 'category',
		},
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: {
				position: 'sidebar',
				description: '숫자가 낮을수록 사이드바에서 먼저 표시됩니다.',
			},
		},
	],
}
