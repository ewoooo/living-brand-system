/**
 * Production Agent의 loadSkill 분류 단계만 실행해 triage 정확도와 token을 측정한다.
 * 실행: PAYLOAD_DB_PUSH=false AGENT_CHAT_TRIAGE_ENABLED=true
 *   AGENT_TRIAGE_EVAL_COOKIE=... pnpm payload run scripts/eval-agent-triage.ts
 * 선택 실행: AGENT_TRIAGE_EVAL_CASE=guideline-logo-clearspace-lookup
 * 일부 실행: AGENT_TRIAGE_EVAL_LIMIT=5
 */
import config from '@payload-config'
import { getPayload } from 'payload'
import { agentChatAgent } from '@/agents/agent-chat.agent'
import { agentQueryTriageDecisionSchema } from '@/features/agent-chat/domain/agent-query-triage'
import { isPayloadUser } from '@/lib/auth'
import { agentTriageEvaluationCases } from './fixtures/agent-triage-evaluation'

type AgentChatStep = Awaited<ReturnType<typeof agentChatAgent.generate>>['steps'][number]
type EvaluationCheck = 'name' | 'responseLevel' | 'taskType' | 'risk'

interface EvaluationResult {
	checks: Record<EvaluationCheck, boolean>
	confidence: number
	expectedRisk: 'high' | 'low'
	passed: boolean
	totalTokens: number
}

if (process.env.PAYLOAD_DB_PUSH !== 'false') {
	throw new Error('Agent triage evaluation requires PAYLOAD_DB_PUSH=false.')
}
if (process.env.AGENT_CHAT_TRIAGE_ENABLED !== 'true') {
	throw new Error('Agent triage evaluation requires AGENT_CHAT_TRIAGE_ENABLED=true.')
}

const requestedCase = process.env.AGENT_TRIAGE_EVAL_CASE
const filteredCases = requestedCase
	? agentTriageEvaluationCases.filter(({ id }) => id === requestedCase)
	: agentTriageEvaluationCases
const selectedCases = filteredCases.slice(0, parseLimit(process.env.AGENT_TRIAGE_EVAL_LIMIT))

if (selectedCases.length === 0) {
	throw new Error(`Unknown AGENT_TRIAGE_EVAL_CASE: ${requestedCase}`)
}

const ids = new Set(agentTriageEvaluationCases.map(({ id }) => id))
if (ids.size !== agentTriageEvaluationCases.length) {
	throw new Error('Agent triage evaluation case ids must be unique.')
}

const payload = await getPayload({ config })

try {
	const { user } = await payload.auth({
		headers: new Headers({ cookie: requiredEnv('AGENT_TRIAGE_EVAL_COOKIE') }),
	})
	if (!isPayloadUser(user))
		throw new Error('Agent triage evaluation requires a valid user cookie.')

	const results: EvaluationResult[] = []

	for (const testCase of selectedCases) {
		const { decision, totalTokens } = await classify(testCase.input, user)
		const checks = {
			name: decision.name === testCase.expected.name,
			responseLevel: decision.responseLevel === testCase.expected.responseLevel,
			taskType: decision.taskType === testCase.expected.taskType,
			risk: decision.risk === testCase.expected.risk,
		}
		const passed = Object.values(checks).every(Boolean)

		results.push({
			checks,
			confidence: decision.confidence,
			expectedRisk: testCase.expected.risk,
			passed,
			totalTokens,
		})

		console.log(
			`${passed ? 'passed' : 'failed'}: ${testCase.id} ` +
				`(${decision.name}, ${decision.responseLevel}/${decision.taskType}, ` +
				`${decision.risk}, ${totalTokens} tokens)`,
		)
	}

	const count = results.length
	const correct = (key: EvaluationCheck) => results.filter(({ checks }) => checks[key]).length
	const highRiskCases = results.filter(({ expectedRisk }) => expectedRisk === 'high')
	const highRiskDetected = highRiskCases.filter(({ checks }) => checks.risk).length
	const average = (values: number[]) =>
		Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)

	console.log('\nAgent triage evaluation')
	console.log(`exact: ${results.filter(({ passed }) => passed).length}/${count}`)
	console.log(`skill: ${correct('name')}/${count}`)
	console.log(`responseLevel: ${correct('responseLevel')}/${count}`)
	console.log(`taskType: ${correct('taskType')}/${count}`)
	console.log(`risk: ${correct('risk')}/${count}`)
	console.log(`high-risk recall: ${highRiskDetected}/${highRiskCases.length}`)
	console.log(`average confidence: ${average(results.map(({ confidence }) => confidence))}`)
	console.log(
		`average classifier tokens: ${average(results.map(({ totalTokens }) => totalTokens))}`,
	)

	if (results.some(({ passed }) => !passed)) process.exitCode = 1
} finally {
	await payload.destroy()
}

async function classify(
	input: string,
	user: NonNullable<Awaited<ReturnType<typeof payload.auth>>['user']>,
) {
	const controller = new AbortController()
	const classifierSteps: AgentChatStep[] = []
	let decision: ReturnType<typeof agentQueryTriageDecisionSchema.parse> | undefined

	try {
		await agentChatAgent.generate({
			abortSignal: controller.signal,
			options: { pagePath: '/guidelines', user },
			prompt: input,
			timeout: 120_000,
			onStepEnd: (step) => {
				const loadSkill = step.toolResults.find(
					(result) => result.dynamic !== true && result.toolName === 'loadSkill',
				)
				if (!loadSkill) return
				classifierSteps.push(step)
				const parsedDecision = agentQueryTriageDecisionSchema.safeParse(loadSkill.output)
				if (!parsedDecision.success) return
				decision = parsedDecision.data
				controller.abort()
			},
		})
	} catch (error) {
		if (!controller.signal.aborted) throw error
	}

	if (!decision) throw new Error('Agent triage evaluation did not receive a final decision.')

	return {
		decision,
		totalTokens: classifierSteps.reduce((sum, step) => sum + (step.usage.totalTokens ?? 0), 0),
	}
}

function parseLimit(value: string | undefined) {
	if (!value) return agentTriageEvaluationCases.length
	const limit = Number(value)
	if (!Number.isInteger(limit) || limit < 1) {
		throw new Error('AGENT_TRIAGE_EVAL_LIMIT must be a positive integer.')
	}
	return limit
}

function requiredEnv(name: string) {
	const value = process.env[name]
	if (!value) throw new Error(`${name} is required.`)
	return value
}
