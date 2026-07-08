import { type CollectionConfig, slugField } from 'payload'
import { guidelineBlocks } from '@/blocks/guideline'
import { deriveRulesFromBlocks } from '@/features/guideline/blocks/registry'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const GuidelinePages: CollectionConfig = {
	slug: 'guideline-pages',
	access: managerManagedAccess,
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
	},
	versions: draftVersions,
	defaultSort: 'displayOrder',
	hooks: {
		// 가이드라인(블록)이 SSOT — 발행 시 블록 내용에서 룰의 evidence·referenceAssets를 파생해 반영한다.
		// 파생 규칙은 rule-derivation이 소유(순수)하고, rules 갱신 I/O만 이 훅이 req 트랜잭션으로 처리한다.
		// rules 컬렉션엔 되돌아오는 훅이 없어 루프가 없다.
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
		// [deprecated] 룰 배치는 블록 레벨(blocks[].rules)로 이전 중이다. 과도기 동안만 유지한다.
		// 기준값은 rules 컬렉션이 소유하며, 검수 실행은 이 배치에 의존하지 않는다.
		{
			name: 'rules',
			type: 'array',
			admin: {
				description:
					'[deprecated] 블록 레벨 rules로 이전 중입니다. 신규 배치는 블록에 연결하세요.',
			},
			fields: [
				{
					name: 'rule',
					type: 'relationship',
					relationTo: 'rules',
					required: true,
					filterOptions: {
						status: { equals: 'live' },
					},
				},
			],
		},
		{
			name: 'section',
			type: 'relationship',
			relationTo: 'sections',
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
