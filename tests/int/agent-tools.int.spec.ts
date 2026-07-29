import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import { getAgentTools } from '@/agents/agent-tools.agent'
import { validateAgentChatMessages } from '@/agents/validate-agent-chat-messages.agent'
import * as agentSkillRepository from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import * as agentTemplateRepository from '@/features/agent-chat/repositories/agent-template.payload.repository'
import * as agentGuidelineContext from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { getAgentCitations } from '@/features/agent-chat/utils/get-agent-citations'
import { getAgentMessageText } from '@/features/agent-chat/utils/get-agent-message-parts'
import * as checkScenarioService from '@/features/asset-check/services/get-check-scenarios.service'
import { extractTextFromLexical } from '@/features/guideline/utils/lexical-text'
import * as checkSessionService from '@/services/start-check-session.service'

const textNode = ({
	id = 'name',
	name = 'Name',
	text = 'Name',
}: {
	id?: string
	name?: string
	text?: string
} = {}) => `<p data-node-id="${id}" data-figma-type="TEXT" data-name="${name}">${text}</p>`

const htmlTemplate = (
	overrides: Record<string, { input?: Record<string, unknown> }>,
	...nodes: string[]
) => ({
	html: `<div data-node-id="frame" data-figma-type="FRAME">${nodes.join('')}</div>`,
	overrides,
	width: 900,
	height: 500,
})

const runtimeCheck = (key: string) => ({
	key,
	title: key,
	checker: { key: 'manual', type: 'manual' as const },
	executor: 'manual' as const,
	implemented: true,
	evidence: '',
	referenceAssets: [],
})

const checkResult = (key: string) => ({
	rule: { key, title: key, executor: 'manual' as const },
	checker: { key: 'manual', type: 'manual' as const },
	rawResult: { status: 'pass' as const, fulfillment: 100 },
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

	it.each([
		{
			caseName: '빈 ruleset',
			pendingCheckKeys: [],
			results: {},
			rulesetSnapshot: [],
		},
		{
			caseName: '부분 결과',
			pendingCheckKeys: [],
			results: { first: checkResult('first') },
			rulesetSnapshot: [runtimeCheck('first'), runtimeCheck('second')],
		},
		{
			caseName: 'pending 결과',
			pendingCheckKeys: ['second'],
			results: { first: checkResult('first') },
			rulesetSnapshot: [runtimeCheck('first'), runtimeCheck('second')],
		},
		{
			caseName: '예상 밖 결과',
			pendingCheckKeys: [],
			results: { first: checkResult('first'), extra: checkResult('extra') },
			rulesetSnapshot: [runtimeCheck('first')],
		},
	])('$caseName를 Agent가 passed로 요약하지 않는다', async (checkRun) => {
		vi.spyOn(checkScenarioService, 'getCheckScenarios').mockResolvedValue([
			{ key: 'quick', title: '빠른 검수', checkKeys: ['first', 'second'] },
		])
		vi.spyOn(checkSessionService, 'startCheckSession').mockResolvedValue({
			checkSessionId: 41,
			pendingCheckKeys: checkRun.pendingCheckKeys,
			results: checkRun.results,
			rulesetSnapshot: checkRun.rulesetSnapshot,
		} as never)
		const tools = getAgentTools()

		const result = await tools.runCheck.execute?.({}, {
			context: { user: { id: 1 } },
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'file',
							mediaType: 'image/png',
							filename: 'check.png',
							data: Buffer.from('image'),
						},
					],
				},
			],
		} as never)

		expect(result).toMatchObject({
			isComplete: false,
			outcome: 'needs_manager_check',
		})
		expect((result as { summary: string }).summary).toContain('통과로 판단할 수 없습니다')
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
				...htmlTemplate({ name: { input: { label: '이름' } } }, textNode()),
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
				...htmlTemplate({ name: { input: { label: '이름' } } }, textNode()),
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
				...htmlTemplate({ name: { input: { label: '이름 (한글)' } } }, textNode()),
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
			...htmlTemplate(
				{
					name: { input: { maxLength: 5 } },
					department: { input: { label: '부서' } },
				},
				textNode(),
				textNode({ id: 'department', name: '부서', text: 'Team' }),
				textNode({ id: 'fixed', text: 'Fixed' }),
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
				department: { text: 'HX팀' },
				name: { text: '홍길동입니' },
			},
		})
	})

	it('lists slots nested inside HTML frames', async () => {
		vi.spyOn(agentTemplateRepository, 'listAgentTemplates').mockResolvedValue([
			{
				id: 5,
				name: 'Stacked card',
				description: null,
				...htmlTemplate(
					{ nested_name: { input: { label: '이름' } } },
					`<div data-node-id="nested-frame">${textNode({ id: 'nested_name' })}</div>`,
				),
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

	it('throws when the template is missing or has no renderable HTML', async () => {
		vi.spyOn(agentTemplateRepository, 'findAgentTemplate').mockResolvedValue(null as never)
		const tools = getAgentTools()

		await expect(
			tools.prepareTemplateImage.execute?.({ templateId: 99, values: {} }, {
				context: { user: { id: 1 } },
			} as never),
		).rejects.toThrow('Template is not available.')

		vi.mocked(agentTemplateRepository.findAgentTemplate).mockResolvedValue({
			id: 99,
			name: 'Legacy JSON only',
			description: null,
		} as never)

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
