import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'

/**
 * Rule catalog. 하나의 rule은 하나의 검수 컨텍스트와 기준값을 대표한다.
 * 페이지는 rule을 배치/노출만 하고, 검수 런타임은 이 컬렉션을 기준 SSOT로 읽는다.
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
		defaultColumns: ['key', 'title', 'category', 'tier', 'executor'],
	},
	fields: [
		{
			name: 'key',
			type: 'text',
			required: true,
			unique: true,
			index: true,
			admin: { description: 'domain.subject.property 점 표기. 예: logo.size.minimum' },
		},
		{ name: 'title', type: 'text', required: true },
		{
			name: 'titleKo',
			type: 'text',
			admin: { description: '룰의 한글 표기 (브랜드 무관, key당 1:1). 예: 로고 최소 크기' },
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
			options: [
				{ label: 'A · deterministic', value: 'A' },
				{ label: 'B · heuristic', value: 'B' },
				{ label: 'C · advisory', value: 'C' },
			],
		},
		{
			name: 'executor',
			type: 'select',
			options: ['deterministic', 'heuristic', 'advisory'],
		},
		{
			name: 'paramSchema',
			type: 'textarea',
			admin: { description: '브랜드 값이 채워야 할 구조(요약 표기)' },
		},
		{
			name: 'value',
			type: 'textarea',
			admin: { description: '이 rule의 검수 기준값입니다.' },
		},
		{
			name: 'evidence',
			type: 'textarea',
			admin: { description: '이 rule의 가이드라인 근거 문장입니다.' },
		},
		{
			name: 'referenceAssets',
			type: 'relationship',
			relationTo: 'application-images',
			hasMany: true,
			admin: { description: '비전 검수나 운영 판단에 참고할 기준 이미지입니다.' },
		},
		{ name: 'scoring', type: 'textarea' },
		{ name: 'input', type: 'textarea' },
		{ name: 'notes', type: 'textarea' },
		// 발행 Version의 최소 대체물. RuleVersion 정식 도입 전까지 forward-compatible 하게 둔다.
		{
			name: 'status',
			type: 'select',
			defaultValue: 'live',
			options: ['draft', 'live', 'archived'],
		},
	],
}
