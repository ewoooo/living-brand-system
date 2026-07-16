import type { CollectionConfig } from 'payload'
import { authenticated, managerOrAdmin } from '@/lib/auth'

export const CheckSessions: CollectionConfig = {
	slug: 'check-sessions',
	access: {
		// Worker는 검수 실행(create)만 가능하고, 기록된 결과는 수정하지 못한다.
		// 검수 완료 저장은 service repository의 trusted write만 우회한다.
		read: managerOrAdmin,
		create: authenticated,
		update: () => false,
		delete: managerOrAdmin,
	},
	labels: {
		singular: '검수 기록',
		plural: '검수 기록',
	},
	admin: {
		group: '운영 기록',
		useAsTitle: 'source',
		defaultColumns: ['source', 'status', 'imageName', 'createdBy', 'createdAt'],
		description: '검수 실행 1회 단위의 세션 기록입니다.',
	},
	fields: [
		{
			name: 'source',
			type: 'select',
			required: true,
			defaultValue: 'review-page',
			options: [
				{ label: 'MCP Call', value: 'mcp-call' },
				{ label: 'Review Page', value: 'review-page' },
				{ label: 'Chat', value: 'chat' },
			],
			admin: {
				description: '검수가 시작된 진입점입니다.',
			},
		},
		{
			name: 'status',
			type: 'select',
			required: true,
			defaultValue: 'running',
			options: [
				{ label: 'Running', value: 'running' },
				{ label: 'Completed', value: 'completed' },
				{ label: 'Failed', value: 'failed' },
			],
		},
		{
			name: 'targetType',
			type: 'select',
			required: true,
			defaultValue: 'uploaded-image',
			options: [{ label: 'Uploaded Image', value: 'uploaded-image' }],
		},
		{
			name: 'imageName',
			type: 'text',
		},
		{
			name: 'rulesetSnapshot',
			type: 'json',
			admin: {
				description: '검수 실행 시점의 Check Scenario 기준 Check 스냅샷입니다.',
			},
		},
		{
			name: 'results',
			type: 'json',
			admin: {
				description: 'rule key별 검수 결과입니다.',
			},
		},
		{
			name: 'agentChatSession',
			type: 'relationship',
			relationTo: 'agent-chat-sessions',
			admin: {
				description: '채팅에서 시작된 검수일 때 원본 Agent Chat Session입니다.',
			},
		},
		{
			name: 'aiUsage',
			type: 'group',
			admin: {
				description: 'AI 검수 비용 분석에 쓰는 모델과 토큰 사용량입니다.',
			},
			fields: [
				{
					name: 'model',
					type: 'text',
				},
				{
					name: 'callCount',
					type: 'number',
					admin: { step: 1 },
				},
				{
					name: 'inputTokens',
					type: 'number',
					admin: { step: 1 },
				},
				{
					name: 'outputTokens',
					type: 'number',
					admin: { step: 1 },
				},
				{
					name: 'totalTokens',
					type: 'number',
					admin: { step: 1 },
				},
				{
					name: 'cacheReadInputTokens',
					type: 'number',
					admin: { step: 1 },
				},
				{
					name: 'cacheWriteInputTokens',
					type: 'number',
					admin: { step: 1 },
				},
				{
					name: 'reasoningTokens',
					type: 'number',
					admin: { step: 1 },
				},
				{
					name: 'rawUsage',
					type: 'json',
				},
			],
		},
		{
			name: 'errorMessage',
			type: 'textarea',
		},
		{
			name: 'completedAt',
			type: 'date',
		},
		{
			name: 'createdBy',
			type: 'relationship',
			relationTo: 'users',
			admin: {
				position: 'sidebar',
			},
		},
	],
	timestamps: true,
}
