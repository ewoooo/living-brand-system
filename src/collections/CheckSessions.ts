import type { CollectionConfig } from 'payload'
import { authenticated, managerOrAdmin } from '@/lib/auth'

export const CheckSessions: CollectionConfig = {
	slug: 'check-sessions',
	access: {
		read: managerOrAdmin,
		create: authenticated,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	labels: {
		singular: 'Check Session',
		plural: 'Check Sessions',
	},
	admin: {
		group: 'Quality',
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
				description: '검수 실행 시점의 룰셋 스냅샷입니다.',
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
