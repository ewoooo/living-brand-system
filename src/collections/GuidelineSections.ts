import { type CollectionConfig, slugField } from 'payload'
import { guidelineBlocks } from '@/blocks/guideline'
import {
	deriveRuleRefsFromBlocks,
	deriveRulesFromBlocks,
} from '@/features/guideline/blocks/registry'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

const sectionBlockDbNames: Record<string, string> = {
	columnUnit: 'section_cu',
	mediaShowcase: 'section_ms',
	colorPalette: 'section_cp',
	doDont: 'section_dd',
}

const sectionBlocks = guidelineBlocks.map((block) => ({
	...block,
	dbName: sectionBlockDbNames[block.slug],
}))

export const GuidelineSections: CollectionConfig = {
	slug: 'guideline-sections',
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
		description: '장 하위 섹션입니다. 자체 블록과 하위 페이지를 가질 수 있습니다.',
		listSearchableFields: ['title', 'slug'],
	},
	versions: draftVersions,
	defaultSort: 'displayOrder',
	hooks: {
		beforeChange: [
			({ data }) => {
				if (data.blocks !== undefined) data.rules = deriveRuleRefsFromBlocks(data.blocks)
				return data
			},
		],
		afterChange: [
			async ({ doc, req }) => {
				if (doc._status && doc._status !== 'published') return doc
				for (const derivation of deriveRulesFromBlocks(doc.blocks)) {
					await req.payload.update({
						collection: 'rules',
						id: derivation.rule,
						data: {
							evidence: derivation.evidence,
							referenceAssets: derivation.referenceAssets,
						},
						req,
					})
				}
				return doc
			},
		],
	},
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
			relationTo: 'guideline-chapters',
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
			name: 'headerImage',
			type: 'upload',
			relationTo: 'application-images',
			admin: {
				description: '섹션 랜딩 헤더에 표시할 이미지입니다.',
			},
		},
		{
			name: 'pages',
			type: 'join',
			collection: 'guideline-pages',
			on: 'section',
		},
		{
			name: 'blocks',
			type: 'blocks',
			blocks: sectionBlocks,
		},
		{
			name: 'rules',
			type: 'array',
			admin: {
				hidden: true,
				description: '블록의 룰 관계에서 자동 생성하는 역참조용 인덱스입니다.',
			},
			fields: [
				{
					name: 'rule',
					type: 'relationship',
					relationTo: 'rules',
					required: true,
				},
			],
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
