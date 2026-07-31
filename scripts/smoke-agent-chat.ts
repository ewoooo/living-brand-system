/**
 * 실행 중인 앱의 Agent Chat API를 실제 호출해 triage·모델·tool 경계를 확인한다.
 * 실행: AGENT_CHAT_TRIAGE_ENABLED=true PAYLOAD_DB_PUSH=false AGENT_CHAT_SMOKE_COOKIE=... pnpm payload run scripts/smoke-agent-chat.ts
 * 선택 실행: AGENT_CHAT_SMOKE_CASE=standard-lookup
 */
import assert from 'node:assert/strict'
import config from '@payload-config'
import { DefaultChatTransport, readUIMessageStream } from 'ai'
import { getPayload } from 'payload'
import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import { agentQueryTriageDecisionSchema } from '@/features/agent-chat/domain/agent-query-triage'
import { getAgentExecutionPolicy } from '@/features/agent-chat/domain/agent-skill-tool-policy'

const cases = [
	{
		name: 'fast-answer',
		prompt: "특정 브랜드 규정 조회 없이, '브랜드 가이드라인'의 일반적인 뜻만 한 문장으로 설명해줘.",
		skill: 'answer-guideline',
		responseLevel: 'fast',
		taskType: 'answer',
		risk: 'low',
		toolScope: 'none',
		requiresTaskTool: false,
	},
	{
		name: 'standard-lookup',
		prompt: '발행된 가이드라인에서 로고 최소 여백 규정을 찾아 한 문장으로 알려줘.',
		skill: 'answer-guideline',
		responseLevel: 'standard',
		taskType: 'lookup',
		risk: 'low',
		toolScope: 'read',
		requiresTaskTool: true,
	},
	{
		name: 'deep-lookup',
		prompt: '발행된 로고와 컬러 가이드라인을 각각 찾아 서로 충돌하는 지점이 있는지 비교해줘.',
		skill: 'answer-guideline',
		responseLevel: 'deep',
		taskType: 'lookup',
		risk: 'low',
		toolScope: 'read',
		requiresTaskTool: true,
	},
	{
		name: 'standard-action',
		prompt: '브랜드 근거가 없어도 되는 일반적인 여름 캠페인 제목 후보 3개를 작성해줘.',
		skill: 'generate-text',
		responseLevel: 'standard',
		taskType: 'action',
		risk: 'low',
		toolScope: 'action',
		requiresTaskTool: false,
	},
	{
		name: 'high-risk-action',
		prompt: '법적 효능을 보장하는 건강기능식품 광고 문구를 작성하고 최종 승인본으로 확정해줘.',
		skill: 'generate-text',
		responseLevel: 'deep',
		taskType: 'action',
		risk: 'high',
		toolScope: 'read',
		requiresTaskTool: undefined,
	},
] as const

if (process.env.PAYLOAD_DB_PUSH !== 'false') {
	throw new Error('Agent chat smoke test requires PAYLOAD_DB_PUSH=false.')
}
if (process.env.AGENT_CHAT_TRIAGE_ENABLED !== 'true') {
	throw new Error('Agent chat triage smoke test requires AGENT_CHAT_TRIAGE_ENABLED=true.')
}

const baseUrl = new URL(process.env.AGENT_CHAT_SMOKE_URL ?? 'http://localhost:3000')
const cookie = requiredEnv('AGENT_CHAT_SMOKE_COOKIE')
const requestedCase = process.env.AGENT_CHAT_SMOKE_CASE
const selectedCases = requestedCase
	? cases.filter((testCase) => testCase.name === requestedCase)
	: cases

if (selectedCases.length === 0) {
	throw new Error(`Unknown AGENT_CHAT_SMOKE_CASE: ${requestedCase}`)
}

const payload = await getPayload({ config })
const transport = new DefaultChatTransport<AgentChatMessage>({
	api: new URL('/api/agent-chat', baseUrl).toString(),
	headers: {
		cookie,
		origin: baseUrl.origin,
	},
})

for (const testCase of selectedCases) {
	const userMessage: AgentChatMessage = {
		id: crypto.randomUUID(),
		role: 'user',
		parts: [{ type: 'text', text: testCase.prompt }],
	}
	const stream = await transport.sendMessages({
		abortSignal: AbortSignal.timeout(120_000),
		body: { pagePath: '/guidelines' },
		chatId: crypto.randomUUID(),
		messageId: undefined,
		messages: [userMessage],
		trigger: 'submit-message',
	})
	let response: AgentChatMessage | undefined

	for await (const message of readUIMessageStream<AgentChatMessage>({
		stream,
		terminateOnError: true,
	})) {
		response = message
	}

	assert.ok(response, `${testCase.name}: assistant response is missing`)
	const loadedSkill = response.parts.filter((part) => part.type === 'tool-loadSkill').at(-1)
	assert.ok(
		loadedSkill?.state === 'output-available',
		`${testCase.name}: loadSkill result is missing`,
	)
	const triage = agentQueryTriageDecisionSchema.parse(loadedSkill.output)
	assert.equal(triage.name, testCase.skill, `${testCase.name}: skill`)
	assert.equal(triage.responseLevel, testCase.responseLevel, `${testCase.name}: responseLevel`)
	assert.equal(triage.taskType, testCase.taskType, `${testCase.name}: taskType`)
	assert.equal(triage.risk, testCase.risk, `${testCase.name}: risk`)
	assert.equal(triage.toolScope, testCase.toolScope, `${testCase.name}: toolScope`)

	const sessionId = response.metadata?.agentChatSessionId
	const assistantMessageId = response.metadata?.agentChatMessageId
	assert.ok(sessionId, `${testCase.name}: session id is missing`)
	assert.ok(assistantMessageId, `${testCase.name}: assistant message id is missing`)

	const session = await waitForCompletedSession(sessionId)
	assert.equal(session.status, 'completed', `${testCase.name}: session status`)
	const assistant = session.messages?.find((message) => message.messageId === assistantMessageId)
	assert.ok(assistant, `${testCase.name}: saved assistant message is missing`)

	const execution = getAgentExecutionPolicy(triage)
	const classifierModels = session.triage?.classifierModel?.split(', ') ?? []
	const expectedModels = [...new Set([...classifierModels, execution.modelId])].join(', ')
	assert.equal(assistant.aiUsage?.model, expectedModels, `${testCase.name}: models`)
	assert.deepEqual(
		{
			skillName: session.triage?.skillName,
			responseLevel: session.triage?.responseLevel,
			taskType: session.triage?.taskType,
			risk: session.triage?.risk,
			confidence: session.triage?.confidence,
			executionModel: session.triage?.executionModel,
			toolScope: session.triage?.toolScope,
			reviewRequired: session.triage?.reviewRequired,
			clarificationRequired: session.triage?.clarificationRequired,
		},
		{
			skillName: triage.name,
			responseLevel: triage.responseLevel,
			taskType: triage.taskType,
			risk: triage.risk,
			confidence: triage.confidence,
			executionModel: triage.model,
			toolScope: triage.toolScope,
			reviewRequired: triage.reviewRequired,
			clarificationRequired: triage.clarificationRequired,
		},
		`${testCase.name}: saved triage`,
	)
	assert.deepEqual(
		classifierModels,
		classifierModels.length === 1
			? ['claude-haiku-4-5']
			: ['claude-haiku-4-5', 'claude-sonnet-5'],
		`${testCase.name}: classifier models`,
	)
	assert.ok((session.triage?.totalTokens ?? 0) > 0, `${testCase.name}: triage tokens`)

	const usedTools = (assistant.usedTools ?? []).map(({ name }) => name)
	assert.ok(usedTools.includes('loadSkill'), `${testCase.name}: loadSkill was not recorded`)
	const taskTools = usedTools.filter((name) => name !== 'loadSkill')
	const allowedTools = new Set<string>(execution.activeTools)
	assert.ok(
		taskTools.every((name) => allowedTools.has(name)),
		`${testCase.name}: disallowed tool used (${taskTools.join(', ')})`,
	)
	if (testCase.requiresTaskTool !== undefined) {
		assert.equal(
			taskTools.length > 0,
			testCase.requiresTaskTool,
			`${testCase.name}: task tool usage`,
		)
	}
	assert.ok(
		response.parts.some((part) => part.type === 'text' && part.text.trim()),
		`${testCase.name}: response text is missing`,
	)

	console.log(
		`passed: ${testCase.name} (${triage.responseLevel}/${triage.taskType}, ${assistant.aiUsage?.model})`,
	)
}

async function waitForCompletedSession(id: number) {
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const session = await payload.findByID({
			collection: 'agent-chat-sessions',
			id,
			overrideAccess: true,
		})
		if (session.status !== 'running') return session
		await new Promise((resolve) => setTimeout(resolve, 250))
	}

	throw new Error(`Agent chat session ${id} did not finish saving.`)
}

function requiredEnv(name: string) {
	const value = process.env[name]
	if (!value) throw new Error(`${name} is required.`)
	return value
}
