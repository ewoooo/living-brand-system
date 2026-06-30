import type { CollectionConfig } from 'payload'
import { authenticated, managerOrAdmin } from '@/lib/auth'

export const AgentSkills: CollectionConfig = {
	slug: 'agent-skills',
	access: {
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	labels: {
		singular: 'Agent Skill',
		plural: 'Agent Skills',
	},
	admin: {
		group: 'Agent',
		useAsTitle: 'name',
		defaultColumns: ['name', 'enabled', 'isDefault', 'updatedAt'],
		description: 'Agent가 선택해 실행할 SKILL.md 형태의 지시문입니다.',
		listSearchableFields: ['name', 'description', 'body'],
	},
	versions: {
		drafts: {
			schedulePublish: true,
		},
		maxPerDoc: 50,
	},
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			unique: true,
			index: true,
			admin: {
				description: 'SKILL.md frontmatter의 name입니다. 예: guideline-qa',
			},
		},
		{
			name: 'description',
			type: 'textarea',
			required: true,
			admin: {
				description: '언제 이 skill을 써야 하는지 설명합니다.',
			},
		},
		{
			name: 'body',
			type: 'textarea',
			required: true,
			admin: {
				description: 'SKILL.md markdown 본문입니다. 실제 agent instruction으로 사용합니다.',
			},
		},
		{
			name: 'references',
			type: 'array',
			fields: [
				{
					name: 'title',
					type: 'text',
					required: true,
				},
				{
					name: 'body',
					type: 'textarea',
					required: true,
					admin: {
						description:
							'provider skill bundle의 references/*.md에 해당하는 markdown 본문입니다.',
					},
				},
				{
					name: 'assets',
					type: 'relationship',
					relationTo: [
						'brand-logos',
						'brand-colors',
						'brand-typefaces',
						'application-images',
						'templates',
						'plugins',
					],
					hasMany: true,
					admin: {
						description:
							'reference가 설명하거나 예시로 드는 내부 브랜드/제작 자원입니다.',
					},
				},
				{
					name: 'enabled',
					type: 'checkbox',
					defaultValue: true,
				},
			],
			admin: {
				description: 'skill 선택 뒤 필요할 때 함께 읽을 reference 문서입니다.',
			},
		},
		{
			name: 'enabled',
			type: 'checkbox',
			defaultValue: true,
			admin: {
				position: 'sidebar',
			},
		},
		{
			name: 'isDefault',
			type: 'checkbox',
			defaultValue: false,
			admin: {
				position: 'sidebar',
				description: 'agent-chat의 기본 skill 후보입니다. 하나만 true로 유지하세요.',
			},
		},
	],
}
