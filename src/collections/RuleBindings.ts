import type { CollectionConfig } from 'payload'
import { authenticated, managerOrAdmin } from '@/lib/auth'

/**
 * Rule 값 할당(binding) — 특정 브랜드 가이드라인의 (page, rule) 배치에 붙는 구체 값.
 * ruleSpec(브랜드 무관 `rules` 카탈로그)은 "형"만 담고, 그 형에 채워지는 실제 값(value)과
 * 근거(evidence)는 배치마다 다르므로(같은 rule이 여러 페이지에 다른 값으로 등장) 여기에 둔다.
 * 현재는 단일 브랜드 POC라 brand/model 스코프 필드를 두지 않는다 — 멀티브랜드 시 `brand` 관계만 추가하면 된다.
 * 자연키 = (page, rule). 시드/마이그레이션은 이 쌍으로 멱등 upsert 한다.
 */
export const RuleBindings: CollectionConfig = {
	slug: 'rule-bindings',
	access: {
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	labels: {
		singular: 'Rule Binding',
		plural: 'Rule Bindings',
	},
	admin: {
		group: 'Guideline',
		useAsTitle: 'rule',
		defaultColumns: ['rule', 'page', 'value', 'updatedAt'],
		description:
			'가이드라인 페이지의 룰 배치에 할당된 브랜드 구체 값(value)과 근거(evidence)입니다.',
	},
	fields: [
		{
			name: 'page',
			type: 'relationship',
			relationTo: 'guideline-pages',
			required: true,
			index: true,
			admin: { description: '이 값이 할당된 가이드라인 페이지입니다.' },
		},
		{
			name: 'rule',
			type: 'relationship',
			relationTo: 'rules',
			required: true,
			index: true,
			admin: { description: '값이 채워지는 룰(ruleSpec)입니다.' },
		},
		{
			name: 'value',
			type: 'textarea',
			admin: { description: '이 배치에서의 브랜드 구체 값. 비어 있을 수 있습니다.' },
		},
		{
			name: 'evidence',
			type: 'textarea',
			admin: { description: '가이드라인 원문 근거(출처).' },
		},
	],
}
