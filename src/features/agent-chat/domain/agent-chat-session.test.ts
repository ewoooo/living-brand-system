import { describe, expect, it } from 'vitest'
import { AgentChatSession, AgentChatSessionStateError } from './agent-chat-session'

function startSession() {
	return AgentChatSession.start({
		id: 41,
		assistantMessageId: 'assistant-1',
		requestMessages: [{ messageId: 'user-1', role: 'user', text: '가이드라인을 찾아줘.' }],
	})
}

const toolStep = {
	model: { modelId: 'test-model' },
	toolCalls: [{ toolName: 'searchGuidelines', input: {} }],
}

describe('AgentChatSession aggregate', () => {
	it('recordStep은 메모리에만 누적하고 running을 유지한다', () => {
		const session = startSession()
		session.recordStep({ step: toolStep, text: '부분 응답' })
		expect(session.status).toBe('running')
		expect(session.isTerminal).toBe(false)
		expect(session.toUpdateData().completedAt).toBeUndefined()
	})

	it('complete는 completedAt을 찍고 assistant 메시지를 합성한다', () => {
		const session = startSession()
		session.recordStep({ step: toolStep, text: '찾은 가이드라인입니다.' })
		session.complete()

		const data = session.toUpdateData()
		expect(data.status).toBe('completed')
		expect(data.completedAt).toEqual(expect.any(String))
		expect(data.messageCount).toBe(2)
		expect(data.usedTools).toEqual([{ name: 'searchGuidelines', callCount: 1 }])
		expect(data.messages[1]).toMatchObject({
			messageId: 'assistant-1',
			role: 'assistant',
			text: '찾은 가이드라인입니다.',
			usedTools: [{ name: 'searchGuidelines', callCount: 1 }],
		})
	})

	it('텍스트와 usage가 전혀 없으면 assistant 메시지를 추가하지 않는다', () => {
		const session = startSession()
		session.complete()

		const data = session.toUpdateData()
		expect(data.messages).toHaveLength(1)
		expect(data.messageCount).toBe(1)
		expect(data.messages[0]).toMatchObject({ messageId: 'user-1', role: 'user' })
	})

	it('종결된 세션에 전이를 시도하면 AgentChatSessionStateError를 던진다', () => {
		const completed = startSession()
		completed.complete()
		expect(() => completed.recordStep({ step: toolStep })).toThrow(AgentChatSessionStateError)
		expect(() => completed.complete()).toThrow(AgentChatSessionStateError)
		expect(() => completed.fail('boom')).toThrow(AgentChatSessionStateError)

		const failed = startSession()
		failed.fail('boom')
		expect(() => failed.complete()).toThrow(AgentChatSessionStateError)
	})

	it('fail은 errorMessage와 completedAt을 기록하고 누적된 부분 텍스트를 보존한다', () => {
		const session = startSession()
		session.recordStep({ step: toolStep, text: '부분 텍스트' })
		session.fail('boom')

		const data = session.toUpdateData()
		expect(data.status).toBe('failed')
		expect(data.errorMessage).toBe('boom')
		expect(data.completedAt).toEqual(expect.any(String))
		expect(data.messages[1]).toMatchObject({ role: 'assistant', text: '부분 텍스트' })
	})
})
