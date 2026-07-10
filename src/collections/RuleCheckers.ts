import type { CollectionConfig, TextFieldValidation } from 'payload'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

type RuleExecutor = 'deterministic' | 'heuristic' | 'manual'

const requiredFor =
	(executor: RuleExecutor, message: string): TextFieldValidation =>
	(value, { siblingData }) => {
		const selectedExecutor = (siblingData as { executor?: RuleExecutor })?.executor
		return (
			selectedExecutor !== executor ||
			(typeof value === 'string' && value.trim().length > 0) ||
			message
		)
	}

export const RuleCheckers: CollectionConfig = {
	slug: 'rule-checkers',
	dbName: 'rule_checkers',
	access: managerManagedAccess,
	labels: {
		singular: 'Rule Checker',
		plural: 'Rule Checkers',
	},
	admin: {
		group: 'Guidelines',
		useAsTitle: 'key',
		defaultColumns: ['key', 'executor', '_status', 'updatedAt'],
		description: 'Brand Rule을 검사할 실행 도구와 호출 계약입니다.',
		listSearchableFields: ['key', 'checkerKey', 'model', 'promptKey'],
	},
	versions: draftVersions,
	fields: [
		{
			name: 'key',
			type: 'text',
			required: true,
			unique: true,
			index: true,
			admin: {
				description: '검사 도구의 안정적인 식별자입니다.',
			},
		},
		{
			name: 'executor',
			type: 'select',
			required: true,
			options: ['deterministic', 'heuristic', 'manual'],
		},
		{
			name: 'checkerKey',
			type: 'text',
			validate: requiredFor('deterministic', 'Checker Key를 입력하세요.'),
			admin: {
				condition: (_, siblingData) => siblingData?.executor === 'deterministic',
				description: '결정론적 checker registry에서 사용할 키입니다.',
			},
		},
		{
			name: 'model',
			type: 'text',
			validate: requiredFor('heuristic', 'Model을 입력하세요.'),
			admin: {
				condition: (_, siblingData) => siblingData?.executor === 'heuristic',
				description: '휴리스틱 검수에 사용할 모델 식별자입니다.',
			},
		},
		{
			name: 'promptKey',
			type: 'text',
			validate: requiredFor('heuristic', 'Prompt Key를 입력하세요.'),
			admin: {
				condition: (_, siblingData) => siblingData?.executor === 'heuristic',
				description: '휴리스틱 검수 프롬프트의 안정적인 키입니다.',
			},
		},
		{
			name: 'rules',
			type: 'join',
			collection: 'rules',
			on: 'checker',
			admin: {
				allowCreate: false,
				defaultColumns: ['key', 'title', 'tier', 'status'],
			},
		},
	],
}
