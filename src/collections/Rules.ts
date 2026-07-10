import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'

/**
 * Rule catalog. 하나의 rule은 하나의 검수 컨텍스트와 기준을 대표한다.
 * 페이지는 rule을 배치/노출만 하고, 검수 런타임은 이 컬렉션을 기준 SSOT로 읽는다.
 * tier(중요도)와 executor(실행 방식)는 독립 축이다 — required=deterministic 같은 1:1 대응을 강제하지 않는다.
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
			name: 'spec',
			type: 'relationship',
			relationTo: 'rule-specs',
			index: true,
			admin: {
				position: 'sidebar',
				description:
					'이 브랜드 규칙을 검사할 Rule Tool입니다. 데이터 전환 후 필수가 됩니다.',
			},
		},
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
			options: ['required', 'recommended'],
			admin: {
				description: '기준 강도. required=반드시 지켜야 하는 기준, recommended=권장 기준.',
			},
		},
		{
			name: 'executor',
			type: 'select',
			options: ['deterministic', 'heuristic', 'manual'],
			admin: {
				description:
					'검수 실행 방식. deterministic=코드 checker, heuristic=AI/시각 추론, manual=사람 확인.',
			},
		},
		{
			name: 'evidence',
			type: 'textarea',
			admin: { description: '검수 기준값과 가이드라인 근거 문장입니다.' },
		},
		{
			name: 'messages',
			type: 'group',
			admin: {
				description:
					'검수 결과 상태별 사용자 노출 문구입니다. {facts.closestFormat}처럼 checker facts를 치환할 수 있습니다.',
			},
			fields: [
				{
					name: 'pass',
					type: 'textarea',
					admin: { description: '통과 시 표시할 문구입니다.' },
				},
				{
					name: 'ok',
					type: 'textarea',
					admin: { description: '부분 확인/허용 시 표시할 문구입니다.' },
				},
				{
					name: 'needsReview',
					type: 'textarea',
					admin: { description: '수동 확인 필요 시 표시할 문구입니다.' },
				},
				{
					name: 'fail',
					type: 'textarea',
					admin: { description: '미통과 시 표시할 문구입니다.' },
				},
			],
		},
		{
			name: 'referencePages',
			type: 'join',
			collection: 'guideline-pages',
			on: 'rules.rule',
			admin: { description: '이 룰을 블록에서 사용하는 가이드라인 페이지입니다.' },
		},
		{
			name: 'referenceSections',
			type: 'join',
			collection: 'guideline-sections',
			on: 'rules.rule',
			admin: { description: '이 룰을 블록에서 사용하는 가이드라인 섹션입니다.' },
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
