import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'

export const GuidelineBlocks: CollectionConfig = {
	slug: 'guideline-blocks',
	dbName: 'guideline_blocks',
	access: managerManagedAccess,
	labels: {
		singular: 'Guideline Block',
		plural: 'Guideline Blocks',
	},
	admin: {
		hidden: true,
		useAsTitle: 'key',
		defaultColumns: ['key', 'parent', 'blockType', 'displayOrder'],
		description: 'Section/Page에 포함된 block을 관계 대상으로 식별하는 인덱스입니다.',
	},
	fields: [
		{
			name: 'key',
			type: 'text',
			required: true,
			unique: true,
			index: true,
		},
		{
			name: 'parent',
			type: 'relationship',
			relationTo: ['guideline-sections', 'guideline-pages'],
			required: true,
		},
		{
			name: 'sourceBlockId',
			type: 'text',
			required: true,
			index: true,
		},
		{
			name: 'blockType',
			type: 'select',
			required: true,
			options: ['columnUnit', 'mediaShowcase', 'colorPalette', 'doDont'],
		},
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			min: 0,
		},
		{
			name: 'linkedRules',
			type: 'join',
			collection: 'rules',
			on: 'documents',
			admin: { allowCreate: false },
		},
	],
}
