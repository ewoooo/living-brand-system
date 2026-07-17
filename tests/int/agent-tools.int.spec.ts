import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import { getAgentTools } from '@/agents/agent-tools.agent'
import { validateAgentChatMessages } from '@/agents/validate-agent-chat-messages.agent'
import * as agentSkillRepository from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import * as agentTemplateRepository from '@/features/agent-chat/repositories/agent-template.payload.repository'
import * as agentGuidelineContext from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { getAgentCitations } from '@/features/agent-chat/utils/get-agent-citations'
import { getAgentMessageText } from '@/features/agent-chat/utils/get-agent-message-parts'
import { extractTextFromLexical } from '@/features/guideline/utils/lexical-text'

const textElement = (
	overrides: Partial<{
		id: string
		locked: boolean
		maxLength: number
		slotLabel: string
		text: string
	}> = {},
) => ({
	id: overrides.id ?? 'name',
	type: 'text' as const,
	x: 0,
	y: 0,
	width: 200,
	height: 40,
	zIndex: 1,
	locked: overrides.locked ?? false,
	text: overrides.text ?? 'Name',
	fontSize: 20,
	fontFamily: 'Pretendard',
	fontWeight: '700',
	color: '#000000',
	lineHeight: 1.2,
	letterSpacing: 0,
	textAlign: 'left' as const,
	...(overrides.maxLength ? { maxLength: overrides.maxLength } : {}),
	...(overrides.slotLabel ? { slotLabel: overrides.slotLabel } : {}),
})

const template = (...elements: ReturnType<typeof textElement>[]) => ({
	width: 900,
	height: 500,
	background: '#ffffff',
	elements,
})

describe('agent tools', () => {
	beforeEach(() => {
		vi.spyOn(agentGuidelineContext, 'listAgentChecks').mockResolvedValue([])
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('lists guideline documents through the tool service', async () => {
		const listDocuments = vi
			.spyOn(agentGuidelineContext, 'listAgentGuidelineDocuments')
			.mockResolvedValue([
				{
					collection: 'guideline-documents',
					id: '7',
					level: 3,
					parentId: '2',
					title: 'Narrative',
				},
			])
		const tools = getAgentTools()

		const result = await tools.listGuidelineDocuments.execute?.({}, {
			context: { user: { id: 1 } },
		} as never)

		expect(listDocuments).toHaveBeenCalled()
		expect(result).toEqual([
			{
				collection: 'guideline-documents',
				id: '7',
				level: 3,
				parentId: '2',
				title: 'Narrative',
			},
		])
	})

	it('loads agent skill instructions through the tool service', async () => {
		const findSkill = vi
			.spyOn(agentSkillRepository, 'findEnabledAgentSkillByName')
			.mockResolvedValue({
				body: 'Rewrite campaign copy.',
				description: 'Copywriting test skill.',
				name: 'copywriter-test',
				references: [],
			})
		const tools = getAgentTools()

		const result = await tools.loadSkill.execute?.({ name: 'copywriter-test' }, {
			context: { user: { id: 1 } },
		} as never)

		expect(findSkill).toHaveBeenCalledWith({ id: 1 }, 'copywriter-test')
		expect(result).toEqual({
			description: 'Copywriting test skill.',
			instructions: 'Rewrite campaign copy.',
			name: 'copywriter-test',
		})
	})

	it('reads guideline document details through the tool service', async () => {
		const readDocument = vi
			.spyOn(agentGuidelineContext, 'readAgentGuidelineDocument')
			.mockResolvedValue(null)
		const tools = getAgentTools()

		await tools.readGuidelineDocument.execute?.(
			{
				collection: 'guideline-documents',
				id: '7',
			},
			{ context: { user: { id: 1 } } } as never,
		)

		expect(readDocument).toHaveBeenCalledWith(
			{ id: 1 },
			{
				collection: 'guideline-documents',
				id: '7',
			},
		)
	})

	it('gets Check catalog through the tool service', async () => {
		const getChecks = vi.spyOn(agentGuidelineContext, 'listAgentChecks').mockResolvedValue([
			{
				evidence: '',
				key: 'color.palette',
				tier: 'required',
				title: 'Color palette',
			},
		])
		const tools = getAgentTools()

		const result = await tools.getCheckCatalog.execute?.({}, {
			context: { user: { id: 1 } },
		} as never)

		expect(getChecks).toHaveBeenCalledWith({ id: 1 })
		expect(result).toEqual([
			expect.objectContaining({
				key: 'color.palette',
				title: 'Color palette',
			}),
		])
	})

	it('lists published templates with open slots and template Checks', async () => {
		vi.spyOn(agentGuidelineContext, 'listAgentChecks').mockResolvedValue([
			{
				evidence: 'Use the legal name.',
				key: 'name.input',
				tier: 'required',
				title: 'Name input',
			},
		])
		vi.spyOn(agentTemplateRepository, 'listAgentTemplates').mockResolvedValue([
			{
				id: 3,
				name: 'Business card',
				description: 'Name card template',
				templateChecks: [
					{
						body: 'Ask only for slots returned by the template.',
						checkKey: 'name.input',
					},
				],
				jsonTemplate: template(textElement({ slotLabel: '이름' })),
			},
		] as never)
		const tools = getAgentTools()

		const result = await tools.findTemplatesForRequest.execute?.({ query: 'legal' }, {
			context: { user: { id: 1 } },
		} as never)

		expect(result).toEqual([
			expect.objectContaining({
				id: 3,
				checks: [
					{
						key: 'name.input',
						title: 'Name input',
						description: 'Use the legal name.',
						body: 'Ask only for slots returned by the template.',
					},
				],
				slots: [expect.objectContaining({ id: 'name', label: '이름' })],
			}),
		])
	})

	it('matches templates from long natural-language Korean queries', async () => {
		vi.spyOn(agentTemplateRepository, 'listAgentTemplates').mockResolvedValue([
			{
				id: 7,
				name: '신규입사자 웰컴 카드',
				description: null,
				templateChecks: [],
				jsonTemplate: template(textElement({ slotLabel: '이름' })),
			},
		] as never)
		const tools = getAgentTools()

		const result = await tools.findTemplatesForRequest.execute?.(
			{ query: '신규 입사자 관련해서 사용할 수 있는 발행된 템플릿' },
			{ context: { user: { id: 1 } } } as never,
		)

		expect(result).toEqual([expect.objectContaining({ id: 7 })])
	})

	it('matches templates from natural-language request tokens', async () => {
		vi.spyOn(agentTemplateRepository, 'listAgentTemplates').mockResolvedValue([
			{
				id: 7,
				name: '환영 카드',
				description: '신규 입사자에게 온라인으로 배부되는 카드',
				templateChecks: [],
				jsonTemplate: template(textElement({ slotLabel: '이름 (한글)' })),
			},
		] as never)
		const tools = getAgentTools()

		const result = await tools.findTemplatesForRequest.execute?.(
			{ query: '신규 입사자가 생겼는데 만들어야하는 것들' },
			{ context: { user: { id: 1 } } } as never,
		)

		expect(result).toEqual([
			expect.objectContaining({
				id: 7,
				name: '환영 카드',
			}),
		])
	})

	it('prepares template image attachments from open slot values only', async () => {
		vi.spyOn(agentTemplateRepository, 'findAgentTemplate').mockResolvedValue({
			id: 4,
			name: 'Business card',
			description: null,
			jsonTemplate: template(
				textElement({ maxLength: 5 }),
				textElement({ id: 'department', slotLabel: '부서', text: 'Team' }),
				textElement({ id: 'fixed', locked: true, text: 'Fixed' }),
			),
		} as never)
		const tools = getAgentTools()

		const result = await tools.prepareTemplateImage.execute?.(
			{
				templateId: 4,
				values: {
					department: { text: 'HX팀' },
					name: { text: '홍길동입니다' },
					fixed: { text: 'changed' },
				},
			},
			{ context: { user: { id: 1 } } } as never,
		)

		expect(result).toMatchObject({
			name: 'Business card',
			templateId: 4,
			type: 'template-image',
			values: {
				department: { text: 'HX' },
				name: { text: '홍길동입니' },
			},
		})
	})

	it('lists slots nested inside stack elements', async () => {
		vi.spyOn(agentTemplateRepository, 'listAgentTemplates').mockResolvedValue([
			{
				id: 5,
				name: 'Stacked card',
				description: null,
				jsonTemplate: {
					width: 900,
					height: 500,
					background: '#ffffff',
					elements: [
						{
							id: 'stack_1',
							type: 'stack',
							x: 0,
							y: 0,
							width: 900,
							height: 500,
							zIndex: 1,
							locked: true,
							direction: 'vertical',
							gap: 0,
							padding: { top: 0, right: 0, bottom: 0, left: 0 },
							children: [
								{
									id: 'nested_name',
									type: 'text',
									locked: false,
									slotLabel: '이름',
									width: 200,
									height: 40,
									text: 'Name',
									fontSize: 20,
									fontFamily: 'Pretendard',
									fontWeight: '700',
									color: '#000000',
									lineHeight: 1.2,
									letterSpacing: 0,
									textAlign: 'left',
								},
							],
						},
					],
				},
			},
		] as never)
		const tools = getAgentTools()

		const result = await tools.findTemplatesForRequest.execute?.({}, {
			context: { user: { id: 1 } },
		} as never)

		expect(result).toEqual([
			expect.objectContaining({
				id: 5,
				slots: [expect.objectContaining({ id: 'nested_name', label: '이름' })],
			}),
		])
	})

	it('drops image slot values whose src is not an authorized asset path', async () => {
		vi.spyOn(agentTemplateRepository, 'findAgentTemplate').mockResolvedValue({
			id: 6,
			name: 'Poster',
			description: null,
			jsonTemplate: {
				width: 900,
				height: 500,
				background: '#ffffff',
				elements: [
					{
						id: 'photo',
						type: 'image',
						x: 0,
						y: 0,
						width: 300,
						height: 200,
						zIndex: 1,
						locked: false,
						slotLabel: '사진',
						assetCollection: 'application-images',
						assetId: 11,
						src: '/api/application-images/file/photo.png',
						objectFit: 'cover',
						borderRadius: 0,
					},
				],
			},
		} as never)
		const tools = getAgentTools()

		const result = await tools.prepareTemplateImage.execute?.(
			{
				templateId: 6,
				values: {
					photo: { src: 'https://attacker.example/x.png' },
				},
			},
			{ context: { user: { id: 1 } } } as never,
		)

		// 외부 URL은 버려지고, 인가 경로만 통과한다.
		expect(result).toMatchObject({ values: {} })

		const allowed = await tools.prepareTemplateImage.execute?.(
			{
				templateId: 6,
				values: {
					photo: { src: '/api/brand-logos/file/logo.svg' },
				},
			},
			{ context: { user: { id: 1 } } } as never,
		)

		expect(allowed).toMatchObject({
			values: { photo: { src: '/api/brand-logos/file/logo.svg' } },
		})
	})

	it('throws when the template is missing or has a broken jsonTemplate', async () => {
		vi.spyOn(agentTemplateRepository, 'findAgentTemplate').mockResolvedValue(null as never)
		const tools = getAgentTools()

		await expect(
			tools.prepareTemplateImage.execute?.({ templateId: 99, values: {} }, {
				context: { user: { id: 1 } },
			} as never),
		).rejects.toThrow('Template is not available.')
	})

	it('rejects invalid tool message input before streaming', async () => {
		const result = await validateAgentChatMessages([
			{
				id: 'message-1',
				role: 'assistant',
				parts: [
					{
						type: 'tool-searchGuidelines',
						toolCallId: 'tool-call-1',
						state: 'input-available',
						input: { query: '' },
					},
				],
			},
		])

		expect(result.success).toBe(false)
	})

	it('extracts text from lexical rich text nodes', () => {
		const text = extractTextFromLexical({
			root: {
				children: [
					{ text: 'Logo' },
					{ type: 'paragraph', children: [{ text: 'minimum size' }] },
				],
			},
		})

		expect(text).toBe('Logo minimum size')
	})

	it('concatenates assistant text parts', () => {
		const text = getAgentMessageText({
			role: 'assistant',
			parts: [
				{ type: 'text', text: '안녕하세요. ' },
				{ type: 'text', text: '브랜드 가이드입니다.' },
			],
		} as AgentChatMessage)

		expect(text).toBe('안녕하세요. 브랜드 가이드입니다.')
	})

	it('collects citations from read guideline documents without duplicates', () => {
		const readPart = (id: string, title: string, href: string | null) => ({
			type: 'tool-readGuidelineDocument',
			toolCallId: `tool-call-${id}-${title}`,
			state: 'output-available',
			input: { collection: 'guideline-documents', id },
			output: {
				title,
				collection: 'guideline-documents',
				id,
				source: { collection: 'guideline-documents', id, title, href },
				checks: [],
				content: title,
			},
		})

		const citations = getAgentCitations({
			role: 'assistant',
			parts: [
				readPart('1', '로고 사용 규정', '/guideline/logo#usage'),
				readPart('1', '로고 사용 규정', '/guideline/logo#usage'),
				readPart('2', '크기 기준', null),
				{
					type: 'tool-readGuidelineDocument',
					toolCallId: 'tool-call-pending',
					state: 'input-available',
					input: { collection: 'guideline-documents', id: '9' },
				},
			],
		} as AgentChatMessage)

		expect(citations).toEqual([
			{
				key: 'guideline-documents:1',
				title: '로고 사용 규정',
				href: '/guideline/logo#usage',
			},
			{ key: 'guideline-documents:2', title: '크기 기준', href: null },
		])
	})
})
