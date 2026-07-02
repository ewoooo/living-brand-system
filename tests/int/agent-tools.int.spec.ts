import { afterEach, describe, expect, it, vi } from 'vitest'
import * as agentGuidelineRepository from '@/features/agent-chat/repositories/agent-guideline-context.payload.repository'
import * as agentSkillRepository from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import * as agentTemplateRepository from '@/features/agent-chat/repositories/agent-template.payload.repository'
import type { AgentChatMessage } from '@/features/agent-chat/services/create-agent-chat-response.service'
import { validateAgentChatMessages } from '@/features/agent-chat/services/create-agent-chat-response.service'
import * as agentGuidelineContext from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { extractTextFromLexical } from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { getAgentTools } from '@/features/agent-chat/services/get-agent-tools.service'
import { getAgentMessageText } from '@/features/agent-chat/utils/get-agent-message-text'

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
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('lists guideline pages through the tool service', async () => {
		const listPages = vi
			.spyOn(agentGuidelineContext, 'listAgentGuidelinePages')
			.mockResolvedValue([{ title: 'Core', pages: [{ id: '7', title: 'Narrative' }] }])
		const tools = getAgentTools()

		const result = await tools.listGuidelinePages.execute?.({}, {
			context: { user: { id: 1 } },
		} as never)

		expect(listPages).toHaveBeenCalled()
		expect(result).toEqual([{ title: 'Core', pages: [{ id: '7', title: 'Narrative' }] }])
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
				collection: 'guideline-pages',
				id: '7',
			},
			{ context: { user: { id: 1 } } } as never,
		)

		expect(readDocument).toHaveBeenCalledWith(
			{ id: 1 },
			{
				collection: 'guideline-pages',
				id: '7',
			},
		)
	})

	it('gets rule catalog through the tool service', async () => {
		const getRules = vi.spyOn(agentGuidelineRepository, 'findAgentRules').mockResolvedValue([
			{
				category: 'color',
				domainDefault: true,
				executor: 'deterministic',
				frequency: 4,
				input: null,
				key: 'color.palette',
				notes: null,
				paramSchema: null,
				scope: ['screen'],
				scoring: null,
				tier: 'A',
				title: 'Color palette',
			},
		])
		const tools = getAgentTools()

		const result = await tools.getRuleCatalog.execute?.({}, {
			context: { user: { id: 1 } },
		} as never)

		expect(getRules).toHaveBeenCalledWith({ id: 1 })
		expect(result).toEqual([
			expect.objectContaining({
				key: 'color.palette',
				title: 'Color palette',
			}),
		])
	})

	it('lists published templates with open slots', async () => {
		vi.spyOn(agentTemplateRepository, 'listAgentTemplates').mockResolvedValue([
			{
				id: 3,
				name: 'Business card',
				description: 'Name card template',
				jsonTemplate: template(textElement({ slotLabel: '이름' })),
			},
		] as never)
		const tools = getAgentTools()

		const result = await tools.findTemplatesForRequest.execute?.({ query: 'card' }, {
			context: { user: { id: 1 } },
		} as never)

		expect(result).toEqual([
			expect.objectContaining({
				id: 3,
				slots: [expect.objectContaining({ id: 'name', label: '이름' })],
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
				textElement({ id: 'fixed', locked: true, text: 'Fixed' }),
			),
		} as never)
		const tools = getAgentTools()

		const result = await tools.prepareTemplateImage.execute?.(
			{
				templateId: 4,
				values: {
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
				children: [{ text: 'Logo' }, { children: [{ text: 'minimum size' }] }],
			},
		})

		expect(text).toBe('Logo minimum size')
	})

	it('renders structured agent output as answer text', () => {
		const text = getAgentMessageText({
			role: 'assistant',
			parts: [
				{
					type: 'text',
					text: JSON.stringify({
						answer: '안녕하세요.',
						citations: [],
						needsHumanReview: false,
					}),
				},
			],
		} as AgentChatMessage)

		expect(text).toBe('안녕하세요.')
	})

	it('renders partial structured agent output while streaming', () => {
		const text = getAgentMessageText({
			role: 'assistant',
			parts: [{ type: 'text', text: '{"answer":"안녕하세요!\\n브랜드' }],
		} as AgentChatMessage)

		expect(text).toBe('안녕하세요!\n브랜드')
	})
})
