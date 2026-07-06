import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'

/**
 * Rule TYPE 프리셋 카탈로그 (브랜드 무관).
 * 모든 브랜드가 공유하는 판단 기준의 "형(型)"만 담는다.
 * 브랜드별 실제 값(hex, min-size 등)은 이 컬렉션이 아니라 별도 brand instance에서 참조한다.
 */
export const Rules: CollectionConfig = {
	slug: 'rules',
	access: managerManagedAccess,
	labels: {
		singular: 'Rule',
		plural: 'Rules (Preset)',
	},
	admin: {
		useAsTitle: 'key',
		group: 'Guideline',
		defaultColumns: ['key', 'title', 'category', 'tier', 'executor'],
	},
	fields: [
		{
			name: 'key',
			type: 'text',
			required: true,
			unique: true,
			index: true,
			admin: { description: 'category.attribute 점 표기. 예: logo.min-size' },
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
				{ label: 'C · advisory/human', value: 'C' },
			],
		},
		{
			name: 'executor',
			type: 'select',
			options: ['deterministic', 'heuristic', 'advisory', 'human'],
		},
		{
			name: 'paramSchema',
			type: 'textarea',
			admin: { description: '브랜드 값이 채워야 할 구조(요약 표기)' },
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
