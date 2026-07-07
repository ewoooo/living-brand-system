import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'

/**
 * Rule catalog. 하나의 rule은 하나의 검수 컨텍스트와 기준을 대표한다.
 * 페이지는 rule을 배치/노출만 하고, 검수 런타임은 이 컬렉션을 기준 SSOT로 읽는다.
 * tier(중요도)와 executor(실행 방식)는 독립 축이다 — A=deterministic 같은 1:1 대응을 강제하지 않는다.
 */
export const Rules: CollectionConfig = {
	slug: 'rules',
	access: managerManagedAccess,
	labels: {
		singular: 'Rule',
		plural: 'Rules',
	},
	admin: {
		useAsTitle: 'key',
		group: 'Guidelines',
		defaultColumns: ['key', 'title', 'category', 'tier', 'executor', 'status'],
	},
	fields: [
		{
			name: 'key',
			type: 'text',
			required: true,
			unique: true,
			index: true,
			admin: {
				description:
					'domain.subject.property 점 표기. 하이픈 없이 점으로만 구분한다. 예: logo.size.minimum',
			},
		},
		{
			name: 'title',
			type: 'text',
			required: true,
			admin: { description: '룰의 표시 이름. 예: 로고 최소 크기' },
		},
		{
			name: 'category',
			type: 'select',
			required: true,
			options: [
				'logo',
				'color',
				'typography',
				'grid',
				'spacing',
				'layout',
				'imagery',
				'illustration',
				'iconography',
				'motion',
				'voice',
				'messaging',
				'accessibility',
				'application',
				'misc',
			],
		},
		{
			name: 'tier',
			type: 'select',
			options: ['A', 'B', 'C'],
			admin: {
				description: '참고 중요도. 실행 방식과 무관하며 우선순위·캐싱 구분에 쓴다.',
			},
		},
		{
			name: 'executor',
			type: 'select',
			options: ['deterministic', 'heuristic', 'advisory'],
			admin: {
				description:
					'검수 실행 방식. deterministic=코드 checker, heuristic=AI 검수, advisory=수동 안내.',
			},
		},
		{
			name: 'evidence',
			type: 'textarea',
			admin: { description: '검수 기준값과 가이드라인 근거 문장입니다.' },
		},
		{
			name: 'referencePages',
			type: 'join',
			collection: 'guideline-pages',
			on: 'rules.rule',
			admin: { description: '이 룰을 배치한 가이드라인 페이지 (역참조, 자동 집계).' },
		},
		{
			name: 'referenceAssets',
			type: 'relationship',
			relationTo: 'application-images',
			hasMany: true,
			admin: { description: '비전 검수나 운영 판단에 참고할 기준 이미지입니다.' },
		},
		// 발행 Version의 최소 대체물. RuleVersion 정식 도입 전까지 forward-compatible 하게 둔다.
		{
			name: 'status',
			type: 'select',
			defaultValue: 'live',
			options: ['draft', 'live', 'archived'],
		},
	],
}
